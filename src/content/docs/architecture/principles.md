---
title: "Herdr2 架构与实现原理深度解析"
description: "深入解析双平面混合运行时、二进制多路复用协议、无头 ACP 引擎与跨机联邦工程实现。"
---
本文从设计决策、Core 双平面状态机、ACP 无头引擎、Ghostty/PTY 人类工作区恢复、跨机联邦与 Linux → Windows 交叉编译链路，完整解析 **Herdr2**（`herdr-core/crates/herdr2` + `herdr-app`）的内部工程原理。

---

## 1. 总体分层架构：双平面隔离（PTY 工作区 + 无头 ACP 子智能体）

在 Herdr2 架构演进过程中，纯无头版本曾将桌面端全部改成固定对话面板、移除了交互式终端，导致无法在工作区直接打开 Shell 或使用交互式 CLI。最终定型的 **Herdr2 混合架构（Hybrid Architecture）** 在同一个守护进程与桌面框架下，清晰划分两条职责边界：

1. **人类工作区通道（PTY/ConPTY + `libghostty-vt`）**：面向需要人机实时交互的终端、Shell 与交互式 CLI（地址 `t1`, `t2`, ...），运行于持久化 `holder` 子进程中，桌面端通过 `ghostty-sys` 做硬件加速文本网格渲染与全功能键鼠编码。
2. **后台子智能体通道（Headless ACP over stdio NDJSON）**：面向被主 Agent 或人类终端派生的自主协作子 Agent（地址 `a1`, `a2`, ...），不分配 PTY/ConPTY、不开放终端与文件能力、不弹窗不占屏格，通过强类型 JSON-RPC 2.0 驱动并暴露内置 MCP 闭环。

![Herdr2 总体分层架构：双平面混合运行时](/images/docs/herdr2-architecture.svg)

---

## 2. Core 双平面运行时（`herdr-core/crates/herdr2`）

### 2.1 统一寻址键与分离注册表（`runtime.rs`, `runtime/pty.rs`）

为了在不互相污染的前提下允许同一状态机、等待队列、事件订阅、父子通知与跨机联邦统一运作，Core 内部建立了明确的类型隔离：

- **`TargetKey::{Agent(u32), Terminal(u32)}`（`runtime.rs`）**：解析地址 `a*` 与 `t*`，作为 `waiting`、`notes`、通知队列与 `die_with_parent` 映射的统一索引键。
- **双注册表持久化**：
  - `State.reg`（`agents.json`）+ `transcripts/<addr>.jsonl`：存储所有无头 ACP Agent 记录与结构化会话历史；
  - `State.pty_reg`（`terminals.json`）+ `holder` 进程链接（`Link`）：存储工作区交互式终端、`screens`（`ghostty_vt::Terminal` 服务端镜像）及窗口状态。
- **API 层面严格分离与名称去重**：
  - `api/pty.rs` 服务 `terminal.*`（14 个方法：`terminal.run`、`terminal.list`、`terminal.get`、`terminal.kill`、`terminal.rm`、`terminal.keep`、`terminal.label`、`terminal.read`、`terminal.attach`、`terminal.send`、`terminal.wait`、`terminal.keys`、`terminal.interrupt`、`terminal.put`）；
  - `api/run.rs` 与 `api.rs` 服务 `agent.*`；
  - 两类注册表均禁止在同一会话内抢占对方正在存活（`is_live()`）的 `--name` 别名，保证 `h2 get <name>`、`h2 read <name>` 无歧义。
  - `agent.{rm,read,send,interrupt,put}` 在遇到兼容老前端或统一 CLI 地址时，会通过 `resolve_any` 判断 `TargetKey` 并准确路由到 `agent` 或 `pty` 处理分支；但 `terminal.list` 与 `agent.list` 始终严格隔离，互不泄漏。

### 2.2 二进制多路复用协议与流控（`wire.rs`, `viewers.rs`）

客户端与 Core 之间通过 Unix Domain Socket（`$XDG_RUNTIME_DIR/herdr2/<session>.sock`）、Windows Named Pipe 或 SSH stdio 连接，握手阶段走明文 NDJSON；当请求 `"hello"` 携带 `framed: true` 且回复确认后（`server.rs`），连接切换至 **9 字节小端二进制帧协议**（`wire::HEADER = 9`，`MAX_PAYLOAD = 16 MiB`）：

```text
 0       1       2       3   4   5       6       7       8   9 ... 9+len
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+-------+
|      channel (u32 LE)     | k |       len (u32 LE)        | payload   |
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+-------+
                              ^
                              kind: 0=DATA, 1=CREDIT, 2=CLOSE, 3=RESIZE,
                                    4=FOCUS, 5=FACTS, 6=AUTOMATIC_INPUT
```

- **Channel `0`（JSON-RPC 2.0 控制信道）**：承载请求/响应，积压上限 `MAX_CONTROL = 64 MiB`。
- **Channel `N > 0`（事件流与终端实时屏幕视图）**：
  - `events.subscribe` 分配专用通道广播 `agents` / `terminals` 状态快照与增量事件、ACP `transcript` 条目、`doc` 更新通知；通过 256 KiB 滑动信用窗口（`CREDIT`）与 `MAX_PENDING = 4 MiB` `missed` 重同步机制保护内存；
  - `terminal.attach`（含桌面端窗格和 CLI `h2 attach`）使用独立通道双向传输 VT 输出快照/字节流、窗口大小变化（`RESIZE`）、焦点同步（`FOCUS`）、主题字体指标（`FACTS`）与自动终端响应抑制（`AUTOMATIC_INPUT`），多客户端同时查看时通过 `foreground.rs` 与 `viewers.rs` 仲裁前台尺寸，避免后台小窗窃取窗口分辨率。

### 2.3 工作区 PTY 与环境准备（`api/pty.rs`, `holder.rs`, `runtime/pty.rs`）

每次桌面端创建 Space/Tab/Split 时：
1. `terminal_env` 注入 `H2_TERMINAL_ID=t*`、`H2_TERMINAL_SOCKET=<socket>`、隔离作用域令牌（`sweep::VAR`）和初始工作目录 `PWD`。
2. `pty_child_env` 移除 `IDENTITY_VARS`（`H2_AGENT_ID`, `H2_AGENT_SOCKET`, `H2_TERMINAL_ID`, `H2_TERMINAL_SOCKET`）后重新注入终端身份，并设置 `TERM=xterm-256color`、`COLORTERM=truecolor`、`TERM_PROGRAM=ghostty`。
3. 请求通过框架帧（`holder_proto::SPAWN`）发给常驻 `holder` 子进程拉起 PTY/ConPTY（Windows 借助 `programs/h2/conpty/{conpty.dll, x64/OpenConsole.exe}`）；所有原始终端输出回流至服务端 `ghostty_vt::Terminal`（解析光标、标题、状态与快照）并转发给所有订阅前端。

### 2.4 无头 ACP 引擎与严格能力屏蔽（`acp/*`, `api/run.rs`）

当调用 `h2 run` / `h2 mcp` 内的 `h2_run` / `agent.run` 时，走完全独立的 ACP 路径：

1. **零终端进程环境（`api/run.rs`）**：`child_env` 清理掉任何继承自宿主 Shell 的 `TERMINAL_VARS`（`TERM`、`COLORTERM`、`TERM_PROGRAM`、`TERM_PROGRAM_VERSION`）与 `H2_TERMINAL_*`，仅保留业务所需 `H2_AGENT_ID`、`H2_AGENT_SOCKET`、`H2_SESSION`。
2. **协议握手屏蔽与配置能力协商（`acp/proto.rs`）**：发送 `InitializeParams::herdr2()`，显式声明 `ClientCapabilities::headless()`：
   - `fs: { readTextFile: false, writeTextFile: false }`、`terminal: false`（严格无终端）
   - `session.configOptions.boolean: {}`：向兼容 Adapter 声明支持布尔类与枚举类实时配置协商（如 `model`、`reasoning_effort` / `thought_level`、`fast-mode`、`mode`、`collaboration_mode`），并保留旧版 `models` / `modes` 回退解析及 `agent.config` / `h2 config` 运行时覆盖（随 `"config"` 订阅事件与 `--keep` 的 `session/load` 重应用同步；`agent.list` 维持精简视图，`agent.get` 与 `"config"` 事件携带完整 `config_options`）。
3. **三协程传输（`acp/transport.rs`）**：异步 piped stdin/stdout/stderr，单步握手超时 `HANDSHAKE_TIMEOUT = 30s`，保留最近 `64` 行 `stderr`（单行最多 `512` 字节）以便握手失败时给出精准诊断，并绑定平台 `AgentGuard` 防止孤儿进程。
4. **自动注入内置 MCP 与版本回退（`acp/mod.rs`）**：若 `inject_mcp` 开启，向 `session/new` / `session/load` 自动注入 `{ type: "stdio", name: "herdr2", command: <self_exe>, args: ["mcp"], env: ... }`；遇仅识别旧 Schema 的 Adapter 返回 `-32602` 时自动剥离 `"type"` 字段重试；协商模型时优先 `session/set_config_option`，不支持（`-32601`）时回退 `session/set_model`。

### 2.5 串行 Inbox、抢占 `--steer`、Transcript 与权限仲裁

- **串行 Inbox 状态机（`acp/mod.rs`）**：每个 ACP 会话由单 Actor 消费提示词队列（`QueuedPrompt`）。同一会话同时仅执行一个 `session/prompt`，消除并发乱序；发生 `--steer` 时将新提示词插队到队首，发送 `SessionCommand::Steer` -> ACP `session/cancel` 在干净边界终止当前回合，随即弹出队首继续执行。
- **8 类强类型 Transcript（`transcript.rs`）**：定义 `Entry::{User, Thought, Assistant, ToolCall, Plan, Permission, Error, Stderr}`（受内存上限 `MAX_ENTRIES = 2000` / `MAX_BYTES = 2 MiB` 与磁盘 JSONL 持久化保护），同步向 `events.subscribe` 实时推送。
- **权限状态机（`permissions.rs`）**：`PermissionMode` 支持 `ApproveAll`、`ApproveReads`（默认：自动放行 `read/search/think/fetch/list/glob/grep` 只读类调用，写入/执行请求挂起为 `blocked` 并暴露 `PendingPermission` 选项给上游 `approve`/`deny`）、`DenyAll` 与 `Ask`。

### 2.6 混合父子编排链路（`mcp.rs`, `notes.rs`, `api/waiting.rs`）

- **自适应调用方身份识别（`mcp.rs:148` & `api/run.rs`）**：`h2 mcp` 与 `h2` CLI 通过 `client::agent_id().or_else(client::terminal_id)` 自动识别调用方是后台 ACP Agent（`a*`）还是桌面人类工作区终端（`t*`）。
- **混合父子树与通知投递（`notes.rs`）**：
  - `a*` -> `a*`：子状态变更通知直接排队入父 Agent 收件箱（带 `<h2 from="...">` 信封）；
  - `t*` -> `a*`：人类工作区终端派生的无头子 Agent 发生阻塞审批、报错或退出时，通过 `pty_input` 安全粘贴通知到父终端（遵守 `notes_quiet` 静默延迟与 `draft_wait` 输入草稿退避，或直接唤醒正在运行 `h2 wait --children` 的命令行）；
  - 当关闭桌面终端窗格 `t*` 时，触发 `Job::Orphaned(TargetKey::Terminal(id))`，自动清理所有未指定 `--outlive-parent` 的下属 ACP 子 Agent。

---

## 3. 原生桌面端（`herdr2` App / `herdr-app`）实现原理

### 3.1 `ghostty-sys` + GPUI 硬件加速工作区视图

`herdr-app` 在重命名为 **`herdr2` (`0.2.0`)** 并完成全套共存在隔离的同时，完整保留了原版经过长期打磨的桌面交互体验：

- **`crates/ghostty-sys` 与 `src/vt.rs`**：静态链接 `libghostty-vt` 并通过 `bindgen` 生成 FFI 绑定。前端每个 `TerminalView` 维护一个与 Core 同步的本地 `libghostty-vt` 状态机（接收 Channel N 增量屏幕字节与尺寸反馈），由 GPUI 执行合字、颜色对比度自适应（`minimum_contrast`）、平滑滚动与键鼠编码。
- **交互入口统一与全权限启动（`defaults/mods/new-menu/main.js`、`defaults/programs.json`、`src/window.rs`）**：`+` 菜单保留 **`Terminal`** 以及数十种预配置本地 CLI 工具的自动路径探测，各内置编码 Agent（`claude`、`codex`、`opencode`、`cursor`、`copilot`、`amp`、`agy`、`kimi`、`kiro`、`hermes`、`qoder`、`crush`、`gemini` 等）均自带全权限参数，通过 `Core::run`（`terminal.run`）在真实 PTY 中运行；Windows 下 `powershell_argv` / `agent_argv` 自动附带 `-ExecutionPolicy Bypass` 确保 `.ps1` 垫片顺畅执行，且 `programs.rs` 在通用 PowerShell 包装及 `shell_child_seen` 检测中，能在子进程退出回到 Shell 提示符后准确恢复 `agent: false`。
- **双通道 `Agents` 侧栏、非 7501 状态推断与同步清理（`src/hc.rs`、`src/terminal.rs`、`src/window.rs`、`defaults/mods/agents/main.js`、`defaults/mods/peek/main.js`）**：
  1. **事件流双收**：`EventLines` 同时消费 `events.subscribe` 里的 `"terminals"` 与 `"agents"` 快照及增量事件（含 `status`、`pending_permission`、`inbox_len`、`transcript`、`labels` 等），并对两者的跨机 `parent` 地址统一标准化。
  2. **非 OSC 7501 状态机**：保留 `OSC 7501`（`reported == true`）最高优先级；当交互式 Agent 未发送 `7501` 且 `program.agent == true` 时，`TerminalView::inferred_agent_state` + `infer_pty_agent_state` 按「原始标题提示符/spinner（`raw_title` 保留剥离前的符号）→ PTY 实时输出活动（`last_output_at`，过滤 attach 重放与短敲键回显）→ 屏幕尾部交互审批提示（`Vt::tail_lines(6)`）」在每次 `tend_terminals` 周期（≤500 ms）更新工作/阻塞/空闲态并驱动未聚焦完成态（`done`）。
  3. **无头 ACP 集成、T3 Code 对话窗口、能力配置与工作区 Tab 挂载**：`window.rs` 依据 `is_acp_addr` 精确路由无头 `a*` 地址（pin/seen 写入 `agent.label`、击杀写入 `agent.kill`、状态/配置变更经 `hc.rs::EventLines` 消费）。默认点击 `terminal.peek` 开启无外框大尺寸对话浮层（`width: 0.86`, `height: 0.88`, `frame: "none"`）；执行 `terminal.keep` / 点击 `↗ Open as Tab` 时，经由 `layout.rs`（`Node::acp_terminal` / `Node::any_terminal`）、`mirror.rs`（跨机前缀映射）、`model.rs`（`any_address_of` / `acp_pane_of`）与 `window.rs` 将 `Content::Mod { mod: "peek", props: { acp: true, tab: true, terminal } }` 持久化进 Space 的共享 Tab 树并同步关闭弹窗、避重过滤 `headless_agents`；`terminal.park` / 点击 `↙ Background`（或 Tab 右键菜单 `"Detach to background"`）则保留后台会话只卸载 Tab。前端由 [defaults/mods/peek/acp_model.js](file:///home/zzh0838/Work/KnowBase/AI2D/herdr2/herdr-app/defaults/mods/peek/acp_model.js) 与 [defaults/mods/peek/main.js](file:///home/zzh0838/Work/KnowBase/AI2D/herdr2/herdr-app/defaults/mods/peek/main.js) 调用 `h2 read --json <agent>` 与 `h2 get --json <agent>`，在呈现工作日志、Markdown 代码卡片、`pending_permission` 审批与 `TextareaState` 底部编排栏的同时，于底部渲染可实时下拉搜索/输入自定义值与一键开关的能力条（调用 `h2 config --json`）。左侧 `Agents` 行与子行悬停暴露 `✕` 移除按钮（`pane.close` 或 `terminal.kill`），`space.close` 通过 `space_folders` 与多空间去重检查匹配归属 ACP 会话，并在 `kill()` 内通过 `closing_terminals` 过滤与即时 `publish_terminals` / `sync` 在当帧完成视觉与进程双重清除。
- **核心连接与布局共享（`src/hc.rs`, `src/mirror_sync.rs`, `src/control.rs`）**：桌面端通过 `$LOCALAPPDATA/Programs/h2/h2.exe` / `~/.local/bin/h2` 连接对应守护进程，将 Space/Tab/Pane 树持久化至 Core 文档键 `"herdr2-app"`，并通过 `$HERDR2_APP_HOME/herdr2-app.sock`（`HERDR2_APP_HOME` 默认 `~/.config/herdr2-app`）响应 `herdr2 ls/status/do/shot` 控制请求。

---

## 4. Linux → Windows 交叉编译关键技术突破

本次直接在 Linux / WSL2 宿主机完成了同时包含 Rust、Direct3D 11、QuickJS、Zig 0.16 与 `libghostty-vt`（C/C++/Zig 混合编译）的 Windows `x86_64-pc-windows-msvc` 原生发布包交叉编译：

1. **Zig `translate-c` 显式透传 MSVC `--libc` 套件**：
   - 使用 `cargo-xwin` 挂载 `~/.cache/cargo-xwin/xwin/` 下的 MSVC CRT（`crt/include`、`crt/lib/x86_64`）与 Windows SDK UCRT/UM（`sdk/include/ucrt`、`sdk/lib/{ucrt,um}/x86_64`）。
   - 发现 Ghostty 依赖的 `pkg/wuffs/build.zig` 在 `target.os.tag == .windows` 启用 `.link_libc = true` 时，虽然普通 Zig `Compile` 步骤能继承 `zig build --libc <file>`，但上游调用 `translate_c.init` 未将 `b.libc_file` 传递给子步骤 `translate-c`（触发 `'stdlib.h' not found`）。我们在两个仓库的 `vendor/ghostty/pkg/wuffs/build.zig` 中统一透传 `.libc_file = if (b.libc_file) |p| .{ .direct = .{ .cwd_relative = p } } else .detect_darwin,`，使 `simdutf`、`highway`、`wuffs_c` 与 `ghostty-vt` 在 `-Dcpu=baseline` 下一次编译链接通过。
2. **GPUI Direct3D 11 运行时 HLSL 编译（`vendor/gpui-pre-windows`）**：
   - Release 构建跳过 Windows 原生 `fxc.exe`，在 `build.rs` 自动注入 `gpui_runtime_d3dcompile` 条件编译标志；启动阶段直接从内存调用 Windows 系统组件 `D3DCompile`（`d3dcompiler_47.dll`，`D3DCOMPILE_OPTIMIZATION_LEVEL3`）现场编译内置 HLSL 着色器。
3. **ConPTY 运行时随附与进程守卫**：
   - 将兼容版本 `conpty.dll` 与 `x64/OpenConsole.exe` 随附于 `Programs/h2/conpty/`，保证 Windows 10/11 下无论系统 ConPTY 版本如何都能稳定拉起 `powershell.exe` 等交互终端，并向子进程注入 `H2_TERMINAL_ID`。

---

## 5. 双版本彻底隔离边界表

| 隔离边界 | 原版 Herdr | Herdr2 |
|---|---|---|
| Core 二进制与命令名 | `herdr-core` / `hc` | `herdr2` / `h2`（Windows 含 `h2.exe` & `herdr2-core.exe`） |
| Desktop 二进制与窗口标题 | `herdr-app` / `"Herdr"` | `herdr2`（含 `herdr2-app.exe`） / `"Herdr2"` |
| Core 版本协商前缀 | `"hc "` | `"h2 "` |
| Core 环境变量前缀 | `HC_*`（`HC_SESSION`, `HC_AGENT_ID`, `HC_TERMINAL_ID`, `HC_SOCKET`） | `H2_*`（`H2_SESSION`, `H2_AGENT_ID`, `H2_TERMINAL_ID`, `H2_SOCKET`） |
| App 环境变量前缀 | `HERDR_APP_HOME`, `HERDR_TEST_WINDOW`, `HERDR_TELEMETRY` | `HERDR2_APP_HOME`, `HERDR2_TEST_WINDOW`, `HERDR2_APP_ID`, `HERDR2_TELEMETRY` |
| 控制本地套接字 | `~/.config/herdr-app/herdr-app.sock` | `~/.config/herdr2-app/herdr2-app.sock` |
| Core 布局同步文档键 | `"herdr-app"` | `"herdr2-app"` |
| Core 运行时状态目录 | `~/.local/state/herdr-core/` / `%LOCALAPPDATA%\herdr-core\` | `~/.local/state/herdr2/` / `%LOCALAPPDATA%\herdr2\` |
