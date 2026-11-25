---
title: "h2 CLI 命令完整参考"
description: "Herdr2（h2）命令行工具的完整中文参考手册，涵盖智能体与终端管理、通信与审批、上下文交接、检查点回滚、Drove 多智能体编排、跨机联邦与 Core AI 助手的全部命令与选项。"
---

`h2` 是 **Herdr2** 混合运行时（工作区 PTY 终端 + 后台无头 ACP 多智能体）的命令行入口，可直接在本地终端、脚本或跨机 SSH 联邦中编排智能体与工作区。

### 基本约定与全局说明

- **目标地址 `<a|t>`**：支持无头 ACP 智能体地址（如 `a1`）、交互式 PTY 终端地址（如 `t1`）、远端机器地址（如 `machine/a7`）或当前存活节点中的唯一 `--name` 名称。
- **内置 `--agent` 预设**：`agy`、`claude`、`codex`、`cursor`、`dsh`、`gemini`、`opencode`、`copilot`、`kimi`、`qwen`、`pi`、`hermes`、`glm`、`zcode`。
- **通用全局选项**：
  - `--json`：即使在交互式终端中也强制输出 JSON（管道重定向时除 `read`、`file read`、`exec` 外默认输出 JSON）。
  - `-V` / `--version`：查看 `h2` 版本号。
  - `--licenses`：查看第三方开源许可证信息。
  - `-h` / `--help`：查看任意命令或子命令的实时帮助（`h2 <command> --help`）。
- **配置文件**：`~/.config/herdr2/config.toml`（可配置 `default_permissions`、`inject_mcp`、`[agents]` 等）。
- **面向 AI Agent 的操作手册**：执行 `h2 --skill` 获取内置精简说明。

---

## 命令分类速查表

### 智能体与终端生命周期

| 命令 | 用途说明 | 关键选项 / 参数 |
|---|---|---|
| [`h2`](#h2) | 不带子命令时列出当前存活的智能体与终端 | `--json`, `-V`, `--skill` |
| [`h2 run`](#h2-run) | 启动无头 ACP 子智能体（预设、自定义命令或模板） | `--agent`, `--prompt`, `--bg`, `--name`, `--cwd`, `--model`, `--effort`, `--permissions`, `--on`, `--keep` |
| [`h2 ls`](#h2-ls) | 列出当前存活的终端与 ACP 智能体 | `--all`（含已结束）, `--label <K=V>`, `--json` |
| [`h2 get`](#h2-get) | 查看单个智能体或终端的完整状态记录 | `<a\|t>`, `--json` |
| [`h2 read`](#h2-read) | 输出 ACP 结构化会话记录或 PTY 屏幕/滚动历史 | `--last`, `--lines <N>`, `--wait`, `--from-turn`, `--to-turn` |
| [`h2 attach`](#h2-attach) | 在当前 Shell 中实时接管/观察交互式 PTY 终端（`Ctrl-\` 后按 `d` 脱离） | `<t>`, `--observe`, `--history <N>` |
| [`h2 keys`](#h2-keys) | 向存活的 PTY 终端发送命名按键序列 | `<t> <KEYS>...`（如 `enter`, `esc`, `ctrl+c`） |
| [`h2 kill`](#h2-kill) | 终止 ACP 智能体或 PTY 终端进程 | `<a\|t>` |
| [`h2 rm`](#h2-rm) | 删除已结束的智能体或终端记录 | `<a\|t>` |
| [`h2 label`](#h2-label) | 为智能体或终端设置或清除键值标签（`key=` 表示清除） | `<a\|t> <K=V>...` |
| [`h2 keep`](#h2-keep) | 开启/关闭崩溃或重启后的自动恢复（ACP `session/load` 或终端保活） | `<a\|t>`, `--off` |

### 通信、控制与上下文流转

| 命令 | 用途说明 | 关键选项 / 参数 |
|---|---|---|
| [`h2 send`](#h2-send) | 向 ACP 收件箱排队发送提示词/多模态附件，或向 PTY 粘贴输入 | `--steer`（抢占打断）, `--image`, `--resource`, `--resource-link`, `--if`, `--wait` |
| [`h2 inbox`](#h2-inbox) | 查看、编辑、删除或立即发送 ACP 串行收件箱中的排队提示词 | `ls`, `edit`, `rm`, `send`, `resume`, `clear-paused` |
| [`h2 approve`](#h2-approve) | 批准处于 `blocked` 状态的 ACP 权限请求 | `<a>`, `--option <ID>` |
| [`h2 deny`](#h2-deny) | 拒绝处于 `blocked` 状态的 ACP 权限请求 | `<a>`, `--option <ID>` |
| [`h2 config`](#h2-config) | 运行中动态修改 ACP 会话配置（模型、思考强度、快速模式、会话模式） | `<a> --id <K> (--value <V> \| --bool <B>)` |
| [`h2 interrupt`](#h2-interrupt) | 发送 ACP `session/cancel` 或 PTY 中断控制干净终止当前轮 | `<a\|t>`, `--timeout <S>` |
| [`h2 wait`](#h2-wait) | 等待目标退出 `working` 状态、出现特定输出或等待子代变化 | `<a\|t>`, `--children any\|all`, `--output <TEXT>`, `--timeout`, `--no-timeout` |
| [`h2 put`](#h2-put) | 将本地文件暂存到目标智能体/终端所在机器并打印远端路径 | `<a\|t> <FILE>` |
| [`h2 handoff`](#h2-handoff) | 跨 ACP/PTY 智能体执行上下文接力、分支分叉、旁路讨论或合入回传 | `--kind`, `--preset`, `--pty`, `--into`, `--worktree`, `--merge-worktree`, `--prompt` |
| [`h2 checkpoint`](#h2-checkpoint) | 隐藏 Git ref 检查点快照、纯轮次 Diff、双向回滚与回归二分定位 | `ls`, `snap`, `diff`, `rollback`, `bisect` |

### 非智能体执行与文件操作

| 命令 | 用途说明 | 关键选项 / 参数 |
|---|---|---|
| [`h2 exec`](#h2-exec) | 在本机或远端直接执行普通命令，返回精确 stdout/stderr 与退出码 | `--on <MACHINE>`, `--cwd`, `--env`, `--timeout`, `-i/--stdin` |
| [`h2 file`](#h2-file) | 在本机或远端读取、从 stdin 原子写入或精准编辑文件 | `read`（`--offset`/`--limit`）, `write`, `edit`（`--old`/`--new`）, `--on` |

### Core AI 共享助手（`h2 ai`）

| 命令 | 用途说明 | 关键子命令 |
|---|---|---|
| [`h2 ai`](#h2-ai) | 管理与调用 Core 内置共享 AI 助手（状态、模型、摘要、提炼与简报） | [`status`](#h2-ai-status), [`settings-set`](#h2-ai-settings-set), [`models`](#h2-ai-models), [`test`](#h2-ai-test), [`probe-prompt-mode`](#h2-ai-probe-prompt-mode), [`handoff-recommend`](#h2-ai-handoff-recommend), [`briefing`](#h2-ai-briefing), [`summarize-agent`](#h2-ai-summarize-agent), [`commit-message`](#h2-ai-commit-message), [`polish-prompt`](#h2-ai-polish-prompt) |

### Drove 多智能体 DAG 编排（`h2 drove`）

| 命令分组 | 用途说明 | 子命令 |
|---|---|---|
| 运行与调度 | 创建、追加、速启、等待、暂停、恢复、取消与收尾 Drove Run | [`plan`](#h2-drove-plan), [`add`](#h2-drove-add), [`quick`](#h2-drove-quick), [`use`](#h2-drove-use), [`wait`](#h2-drove-wait), [`pause`](#h2-drove-pause), [`resume`](#h2-drove-resume), [`cancel`](#h2-drove-cancel), [`complete`](#h2-drove-complete) |
| 状态、收件箱与干预 | 查看 Run/Task/Message、处理 Worker 提问、下发指导、重试与改派路由 | [`status`](#h2-drove-status), [`web`](#h2-drove-web), [`runs`](#h2-drove-runs), [`show`](#h2-drove-show), [`inbox`](#h2-drove-inbox), [`ack`](#h2-drove-ack), [`reply`](#h2-drove-reply), [`send`](#h2-drove-send), [`inspect`](#h2-drove-inspect), [`retry`](#h2-drove-retry), [`route`](#h2-drove-route) |
| 角色、探测与配置 | 探测已装 ACP 智能体、配置角色与 AI/Magpie 网关、安装技能 | [`roles`](#h2-drove-roles), [`settings`](#h2-drove-settings), [`settings-set`](#h2-drove-settings-set), [`probe`](#h2-drove-probe), [`ai-test`](#h2-drove-ai-test), [`roles-ai-config`](#h2-drove-roles-ai-config), [`magpie-test`](#h2-drove-magpie-test), [`install`](#h2-drove-install) |
| Worker 协议（`h2 drove worker`） | 由 Drove 派生的 Worker ACP 会话内部调用的协议命令 | [`context`](#h2-drove-worker-context), [`inbox`](#h2-drove-worker-inbox), [`ask`](#h2-drove-worker-ask), [`note`](#h2-drove-worker-note), [`read`](#h2-drove-worker-read), [`done`](#h2-drove-worker-done) |

### 跨机联邦、技能安装与守护进程工具

| 命令 | 用途说明 | 关键子命令 / 选项 |
|---|---|---|
| [`h2 machine`](#h2-machine) | 管理通过 SSH 或 `--via` 接入的远端机器 | [`add`](#h2-machine-add), [`ls`](#h2-machine-ls), [`login`](#h2-machine-login), [`update`](#h2-machine-update), [`rename`](#h2-machine-rename), [`rm`](#h2-machine-rm) |
| [`h2 skill`](#h2-skill) | 检测已安装的编码智能体并安装/更新内置 Herdr2 配套技能 | [`status`](#h2-skill-status), [`install`](#h2-skill-install), [`ai-install`](#h2-skill-ai-install) |
| [`h2 server`](#h2-server) | 启动、停止、查询或平滑重启后台 Core 守护进程 | [`start`](#h2-server-start), [`stop`](#h2-server-stop), [`status`](#h2-server-status), [`restart`](#h2-server-restart) |
| [`h2 templates`](#h2-templates) | 列出 `~/.config/herdr2/templates` 中可按名称运行的任务模板 | `--json` |
| [`h2 mcp`](#h2-mcp) | 启动内置 stdio MCP 服务器 | `--json` |
| [`h2 events`](#h2-events) | 实时订阅有序生命周期与状态变更事件流（NDJSON） | `--agent`, `--terminal`, `--children-of`, `--label`, `--doc` |
| [`h2 connect`](#h2-connect) | 通过 stdin/stdout 直接承载底层 JSON-RPC 协议（如 `ssh box herdr2 connect`） | `--session <SESSION>` |
| [`h2 update`](#h2-update) | 更新 `h2` 二进制并平滑重启 Core 守护进程 | `--version <X.Y.Z>`, `--from <FILE>`, `--force` |
| [`h2 schema`](#h2-schema) | 打印完整 OpenRPC 1.3.2 JSON Schema（供客户端与集成开发者使用） | `--json` |

---

## h2

Herdr2 混合 PTY 工作区与无头 ACP 多智能体运行时的主命令行入口；不带子命令直接运行 `h2` 将列出当前所有存活的智能体与终端。

```text
Usage: h2 <command> [options]
       h2
```

- **智能体与终端**：`run`、`ls`、`get`、`read`、`attach`、`keys`、`kill`、`rm`、`label`、`keep`
- **通信与控制**：`send`、`inbox`、`approve`、`deny`、`config`、`interrupt`、`wait`、`put`、`handoff`、`checkpoint`
- **非智能体与文件**：`exec`、`file`
- **更多能力**：`templates`、`mcp`、`events`、`server`、`update`、`machine`、`connect`、`drove`、`skill`、`ai`、`schema`
- **全局选项**：`--json`（管道模式下默认开启，除 `read`/`file read`/`exec` 外）、`-V`/`--version`、`--licenses`、`--skill`

## h2 ai

查看、测试或配置共享 Core AI 助手，以及调用基于 Core AI 的智能辅助能力（简报汇总、提交信息生成、提示词润色、接力推荐等）。

```text
Usage: h2 ai [OPTIONS] <COMMAND>
```

**子命令**：
- `status`：查看共享 Core AI 助手状态、配置与 KV-cache 指标
- `settings-set`：从 JSON 文件更新共享 Core AI 助手配置
- `models`：从 OpenAI 兼容端点（`/models`）拉取可用模型列表
- `test`：测试共享 Core AI 助手的 URL 与 API Key 连通性
- `probe-prompt-mode`：清除历史 prompt-cache 探测记录，设为 `auto` 并重新探测 `shared-prefix` 与 `compact` 模式
- `handoff-recommend`：为上游会话推荐互补的目标 Provider、交接模式与交接备注
- `briefing`：聚合本地与远端智能体及 Drove 运行记录，生成按优先级排序的复工简报
- `summarize-agent`：为指定智能体或终端生成/刷新简明语义标题与进度微摘要
- `commit-message`：使用 Core AI 为当前未提交改动生成简洁的 Git 提交信息
- `polish-prompt`：将草稿提示词润色为更清晰、结构化的 ACP/CLI 智能体指令

**选项**：
- `--json`：在终端中也以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 ai briefing

聚合本机与远端机器的智能体以及 Drove 运行状态，生成按优先级排列的快速追赶简报。

```text
Usage: h2 ai briefing [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <ON>`：指定目标远端机器（参见 `h2 machine ls`）
- `--lang <LANG>`：首选输出语言（`zh-CN` / `en`）
- `--away-minutes <AWAY_MINUTES>`：离开时长（分钟），作为生成总览标题的可选上下文
- `--no-ai`：仅返回确定性聚合结果，不调用 Core AI
- `-h, --help`：显示帮助信息

## h2 ai commit-message

利用共享 Core AI 为指定 Git 仓库中尚未提交的改动生成简洁规范的提交信息。

```text
Usage: h2 ai commit-message [OPTIONS]
```

**选项**：
- `--cwd <CWD>`：Git 仓库目录（默认当前工作目录）
- `--json`：强制以 JSON 格式输出
- `--on <ON>`：指定目标远端机器（参见 `h2 machine ls`）
- `--lang <LANG>`：首选输出语言（`zh-CN` / `en`）
- `--no-ai`：不调用 Core AI，仅返回确定性回退结果
- `-h, --help`：显示帮助信息

## h2 ai handoff-recommend

结合上游会话上下文与目标机器已安装预设，推荐最互补的目标 Provider、交接模式及交接备注。

```text
Usage: h2 ai handoff-recommend [OPTIONS] <SOURCE>
```

**参数**：
- `<SOURCE>`：源智能体或终端（`a1`、`t1`、名称或 `machine/a1`）

**选项**：
- `--installed <INSTALLED>`：目标机器上已安装的预设列表（可重复传入或用逗号分隔）
- `--json`：强制以 JSON 格式输出
- `--lang <LANG>`：调用方界面语言（`zh` / `en`）
- `-h, --help`：显示帮助信息

## h2 ai models

从 OpenAI 兼容的 AI 服务端点（`/models`）获取可用模型列表。

```text
Usage: h2 ai models [OPTIONS]
```

**选项**：
- `--file <FILE>`：包含端点与凭据配置的输入 JSON 文件路径
- `--json`：强制以 JSON 格式输出
- `--url <URL>`：自定义 API 端点 URL
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `--consume`：读取 `--file` 后立即删除该临时文件
- `-h, --help`：显示帮助信息

## h2 ai polish-prompt

将用户粗略的提示词草稿润色为面向 ACP 或 CLI 编码智能体的清晰结构化提示词。

```text
Usage: h2 ai polish-prompt [OPTIONS] <PROMPT>
```

**参数**：
- `<PROMPT>`：待润色的提示词草稿文本

**选项**：
- `--json`：强制以 JSON 格式输出
- `--target <TARGET>`：可选目标智能体或终端（`a1`、`t1`、名称或 `machine/a1`）
- `--kind <KIND>`：目标智能体类型（`acp` 或 `cli`）
- `--context <CONTEXT>`：可选附加背景提示（如工作区或任务概述）
- `--lang <LANG>`：首选输出语言（`zh-CN` / `en`）
- `--on <ON>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 ai probe-prompt-mode

清空此前的 prompt-cache 探测记录，将提示词模式重置为 `auto`，并重新检测端点适用 `shared-prefix` 还是 `compact` 模式。

```text
Usage: h2 ai probe-prompt-mode [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 ai settings-set

从指定的 JSON 文件更新共享 Core AI 助手配置。

```text
Usage: h2 ai settings-set [OPTIONS] --file <FILE>
```

**选项**：
- `--file <FILE>`：包含 Core AI 配置的 JSON 文件路径（必填）
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `--consume`：读取后立即删除输入 JSON 文件（保护 API Key 不落盘残留）
- `-h, --help`：显示帮助信息

## h2 ai status

查看共享 Core AI 助手的当前状态、生效配置以及 KV-cache 命中统计指标。

```text
Usage: h2 ai status [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 ai summarize-agent

为指定智能体或终端生成或刷新简洁的语义标题与进度微摘要。

```text
Usage: h2 ai summarize-agent [OPTIONS] <TARGET>
```

**参数**：
- `<TARGET>`：目标智能体或终端（`a1`、`t1`、名称或 `machine/a1`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--lang <LANG>`：首选输出语言（`zh-CN` / `en`）
- `--no-ai`：不调用 Core AI，仅返回确定性规则摘要
- `-h, --help`：显示帮助信息

## h2 ai test

测试共享 Core AI 助手所配置的 URL、模型与 API Key 是否可用。

```text
Usage: h2 ai test [OPTIONS]
```

**选项**：
- `--file <FILE>`：包含测试参数的临时 JSON 文件路径
- `--json`：强制以 JSON 格式输出
- `--url <URL>`：覆盖测试用的端点 URL
- `--model <MODEL>`：覆盖测试用的模型名称
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `--consume`：读取 `--file` 后立即删除该文件
- `-h, --help`：显示帮助信息

## h2 approve

批准处于 `blocked` 状态的 ACP 智能体当前挂起的权限请求。

```text
Usage: h2 approve [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--option <OPTION>`：显式指定要选择的 ACP 权限 `optionId`（默认选择首个匹配的允许选项）
- `-h, --help`：显示帮助信息

## h2 attach

实时附着到正在运行的交互式 PTY 终端以查看输出并进行键盘交互（按 `Ctrl-\` 再按 `d` 安全脱离）。

```text
Usage: h2 attach [OPTIONS] [TERMINAL]
```

**参数**：
- `[TERMINAL]`：目标终端地址（`t7`、名称或 `machine/t7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--observe`：只读观察模式，不转发输入也不触发窗口尺寸变更
- `--history <HISTORY>`：附着时先回放的历史滚动行数（仅主屏幕生效，默认 `0`）
- `-h, --help`：显示帮助信息

## h2 checkpoint

管理隐藏 Git ref 检查点快照、纯轮次改动 Diff、会话与工作区双向回滚以及回归定位。

```text
Usage: h2 checkpoint [OPTIONS] <COMMAND>
```

**子命令**：
- `ls`：列出目标的隐藏 Git ref 检查点及工作区隔离状态
- `snap`：为智能体或终端手动拍摄检查点快照（默认当前窗格/智能体）
- `diff`：查看两个检查点之间的纯改动 Diff
- `rollback`：将会话状态（以及可选的工作区文件）回滚到更早轮次
- `bisect`：定位最可能引入某个缺陷或回归的检查点轮次

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 checkpoint bisect

结合检查点记录与问题现象描述，定位最可能引入 Bug 或回归的会话轮次。

```text
Usage: h2 checkpoint bisect [OPTIONS] --query <QUERY> <TARGET>
```

**参数**：
- `<TARGET>`：智能体（`a1`）、终端（`t1`）、远端目标（`machine/t1`）或唯一名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `--query <QUERY>`：缺陷现象或回归查询描述（例如 `"哪一轮破坏了 auth 测试？"`）
- `--lang <LANG>`：调用方界面语言（`zh` / `en`）
- `-h, --help`：显示帮助信息

## h2 checkpoint diff

查看两个检查点轮次之间由智能体实际产出的纯代码 Diff。

```text
Usage: h2 checkpoint diff [OPTIONS] <TARGET>
```

**参数**：
- `<TARGET>`：智能体（`a1`）、终端（`t1`）、远端目标（`machine/t1`）或唯一名称

**选项**：
- `--from <FROM>`：起始检查点轮次（默认为 `to` 之前的最近一次快照）
- `--json`：强制以 JSON 格式输出
- `--to <TO>`：结束检查点轮次（默认为最新检查点）
- `-h, --help`：显示帮助信息

## h2 checkpoint ls

列出指定智能体或终端的所有隐藏 Git ref 检查点以及当前工作区隔离状态。

```text
Usage: h2 checkpoint ls [OPTIONS] <TARGET>
```

**参数**：
- `<TARGET>`：智能体（`a1`）、终端（`t1`）、远端目标（`machine/t1`）或唯一名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 checkpoint rollback

将指定智能体或终端的对话状态（以及默认包含的工作区文件）回滚到目标轮次。

```text
Usage: h2 checkpoint rollback [OPTIONS] --to <TO> <TARGET>
```

**参数**：
- `<TARGET>`：智能体（`a1`）、终端（`t1`）、远端目标（`machine/t1`）或唯一名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `--to <TO>`：目标检查点轮次（`0` 表示第 1 轮之前的基线）
- `--no-files`：仅回退对话记忆，保持当前工作区文件不变
- `--confirm`：确认在主检出目录或存在同目录空闲 Shell 时执行破坏性文件还原
- `-h, --help`：显示帮助信息

## h2 checkpoint snap

手动为智能体或终端拍摄一次检查点快照（省略目标时默认指向当前窗格或智能体）。

```text
Usage: h2 checkpoint snap [OPTIONS] [TARGET]
```

**参数**：
- `[TARGET]`：智能体（`a1`）、终端（`t1`）、远端目标（`machine/t1`）或唯一名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `--label <LABEL>`：附带记录的书签备注标签
- `-h, --help`：显示帮助信息

## h2 config

在不重启进程的前提下，实时修改存活 ACP 会话的配置项（如模型、思考强度、快速模式或权限/会话模式）。

```text
Usage: h2 config [OPTIONS] --id <ID> <AGENT>
```

**参数**：
- `<AGENT>`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--id <ID>`：要设置的配置项 ID（例如 `model`、`reasoning_effort`、`fast-mode`、`mode`）
- `--json`：强制以 JSON 格式输出
- `--value <VALUE>`：字符串类型配置值（用于下拉枚举项，如模型、思考强度或模式）
- `--bool <BOOL>`：布尔类型配置值（`true` 或 `false`，例如用于 `fast-mode`）
- `-h, --help`：显示帮助信息

## h2 connect

通过标准输入输出（stdin/stdout）直接承载底层 JSON-RPC 协议，常用于 SSH 跨机桥接（例如 `ssh box herdr2 connect`）。

```text
Usage: h2 connect [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--session <SESSION>`：要连接的 `h2` 会话名（作用同 `H2_SESSION`，在 `sh`、`cmd` 与 PowerShell 中语法一致）
- `-h, --help`：显示帮助信息

## h2 deny

拒绝处于 `blocked` 状态的 ACP 智能体当前挂起的权限请求。

```text
Usage: h2 deny [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--option <OPTION>`：显式指定要选择的 ACP 权限 `optionId`（默认选择首个匹配的拒绝选项）
- `-h, --help`：显示帮助信息

## h2 drove

管理 Drove 多智能体 DAG 编排系统，包括启动计划、监控执行、处理 Worker 通信、角色路由配置与 Web 控制台。

```text
Usage: h2 drove [OPTIONS] [COMMAND]
```

**子命令**：
- `status`：查看 Drove Web 服务、角色配置、AI 状态与活跃 Run
- `web`：打印或在浏览器中打开 Drove Web UI 地址
- `runs`（别名 `ls`）：列出 Drove Run 记录（只读）
- `roles`：查看已配置的 Drove 角色、模型与路由策略（只读）
- `settings` / `settings-set`：读取或通过 JSON 文件更新 Drove 配置
- `probe`：探测已安装的 ACP 智能体并发现其支持的实时模型与思考强度选项
- `ai-test` / `magpie-test`：测试轻量级 AI 助手或可选 Magpie 配额网关连通性
- `roles-ai-config`：使用已配置的 AI 助手自动规划 Drove 角色、模型、擅长标签与路由说明
- `use`：设置后续 CLI 命令默认使用的当前活跃 Run ID
- `plan` / `add` / `quick`：从 YAML/JSON 计划创建 Run、向已有 Run 追加任务，或单条命令速启任务
- `wait` / `inbox` / `show` / `ack` / `reply`：等待协调消息或 Run 结束、查看/确认/回复 Worker 提问
- `send` / `inspect` / `retry` / `route`：向运行中 Worker 发指导、排查诊断、重试任务或改派角色/模型
- `cancel` / `complete` / `pause` / `resume`：取消任务或 Run、完成收尾校验、暂停或恢复调度
- `worker`：由派生 Worker ACP 会话内部调用的协议子命令组
- `install`：安装 Drove 配套智能体技能（`drove`、`drove-add`、`drove-setup`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 drove ack

确认（标记已读）协调器收件箱中的指定消息。

```text
Usage: h2 drove ack [OPTIONS] <MESSAGE_ID>
```

**参数**：
- `<MESSAGE_ID>`：待确认的消息 ID

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove add

向已存在的 Drove Run 追加一个或多个新任务（支持文件、标准输入或命令行参数定义）。

```text
Usage: h2 drove add [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：目标 Run ID（默认使用 `drove use` 选定的 Run 或最新活跃 Run）
- `--file <FILE>`：包含任务定义的 YAML/JSON 文件路径
- `--stdin`：从标准输入读取任务定义
- `--key <KEY>`：新任务的唯一 Key
- `--title <TITLE>`：任务标题
- `--change <CHANGE>`：任务变更目标与具体要求描述
- `--role <ROLE>`：指定执行角色
- `--deps <DEPS>`：前置依赖任务 Key
- `--verify <VERIFY>`：任务级验证命令
- `--worktree`：为该任务启用独立 Git Worktree 隔离
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove ai-test

测试 Drove 轻量级 AI 助手的端点 URL 与 API Key 是否可用。

```text
Usage: h2 drove ai-test [OPTIONS]
```

**选项**：
- `--file <FILE>`：包含测试配置的输入 JSON 文件
- `--json`：强制以 JSON 格式输出
- `--url <URL>`：覆盖测试用的 API URL
- `--model <MODEL>`：覆盖测试用的模型名称
- `--on <MACHINE>`：指定目标远端机器
- `--consume`：读取 `--file` 后立即删除该临时文件
- `-h, --help`：显示帮助信息

## h2 drove cancel

取消指定任务（按 Task ID 或 Key），或在不传任务目标时取消整个 Run。

```text
Usage: h2 drove cancel [OPTIONS] [TARGET]
```

**参数**：
- `[TARGET]`：要取消的任务 ID/Key（省略则取消目标 Run）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：指定所属 Run ID
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove complete

结束并收尾指定 Run（若配置了 Run 级验证门禁 `verify`，将先执行验证）。

```text
Usage: h2 drove complete [OPTIONS] [RUN]
```

**参数**：
- `[RUN]`：Run ID（支持位置参数或 `--run`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN>` 等价）
- `--summary <SUMMARY>`：本次 Run 的最终完成总结
- `--force`：强制完成（跳过部分未就绪检查）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove inbox

列出指定 Run 中协调器尚未读取的收件箱消息（包括 Worker 提问、升级通知等）。

```text
Usage: h2 drove inbox [OPTIONS] [RUN]
```

**参数**：
- `[RUN]`：Run ID（支持位置参数或 `--run`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN>` 等价）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove inspect

查看指定任务或执行尝试（attempt）的结构化诊断信息与最近日志条目。

```text
Usage: h2 drove inspect [OPTIONS] <TARGET>
```

**参数**：
- `<TARGET>`：任务 ID/Key 或 attempt ID

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：指定所属 Run ID
- `--tail <TAIL>`：返回的最近会话记录条数（范围 `1..=200`，默认 `30`）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove install

安装 Drove 配套的智能体技能文件（`drove`、`drove-add`、`drove-setup`）。

```text
Usage: h2 drove install [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--target <DIR>`：自定义技能安装目标目录
- `-h, --help`：显示帮助信息

## h2 drove magpie-test

测试可选的 Magpie 配额网关连通性与响应状态。

```text
Usage: h2 drove magpie-test [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--url <URL>`：覆盖测试用的 Magpie 网关 URL
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove pause

暂停指定 Run 的新任务调度（已在运行的 Worker 不受强制中止影响）。

```text
Usage: h2 drove pause [OPTIONS] [RUN]
```

**参数**：
- `[RUN]`：Run ID（支持位置参数或 `--run`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN>` 等价）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove plan

从 YAML/JSON 计划文件或标准输入创建新的 Drove Run，并立即启动其任务 DAG 调度。

```text
Usage: h2 drove plan [OPTIONS]
```

**选项**：
- `--file <FILE>`：计划 YAML 或 JSON 文件（支持 `{ objective?, maxConcurrency?, verify?, tasks: [...] }` 或任务数组）
- `--json`：强制以 JSON 格式输出
- `--stdin`：从标准输入读取 YAML/JSON 计划
- `--objective <OBJECTIVE>`：本次 Run 的总体目标（默认取计划内 `objective` 或目录名）
- `--cwd <CWD>`：工作区根目录（默认当前工作目录）
- `--max-concurrency <MAX_CONCURRENCY>`：最大并行 Worker 数（范围 `1..16`）
- `--verify <VERIFY>`：在 `complete` 阶段执行的 Run 级验证命令
- `--session <SESSION>`：覆盖协调器会话地址（默认自动取 `$H2_AGENT_ID` 或 `$H2_TERMINAL_ID`）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove probe

探测已安装的 ACP 智能体并发现其可用的实时模型与思考强度（effort）选项。

```text
Usage: h2 drove probe [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器
- `--refresh`：执行真实的 ACP `initialize` + `session/new` 实时探测，而非快速缓存/PATH 扫描
- `-h, --help`：显示帮助信息

## h2 drove quick

直接通过一条命令快速发起只包含单个任务的 Drove Run。

```text
Usage: h2 drove quick [OPTIONS] <PROMPT>
```

**参数**：
- `<PROMPT>`：任务需求描述

**选项**：
- `--json`：强制以 JSON 格式输出
- `--role <ROLE>`：执行角色（默认 `coder`）
- `--cwd <CWD>`：工作区目录
- `--verify <VERIFY>`：验证命令
- `--worktree`：启用独立 Git Worktree 隔离
- `--wait`：阻塞等待该任务完成
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove reply

回复来自 Worker 的阻塞提问或升级求助消息，使 Worker 得以继续执行。

```text
Usage: h2 drove reply [OPTIONS] <MESSAGE_ID> <BODY>
```

**参数**：
- `<MESSAGE_ID>`：要回复的消息 ID
- `<BODY>`：回复内容文本

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove resume

恢复处于暂停状态的 Drove Run，继续调度待执行任务。

```text
Usage: h2 drove resume [OPTIONS] [RUN]
```

**参数**：
- `[RUN]`：Run ID（支持位置参数或 `--run`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN>` 等价）
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove retry

重试失败或中断的任务，可选附带修复提示或更换角色、智能体、模型及审查配置。

```text
Usage: h2 drove retry [OPTIONS] <TASK>
```

**参数**：
- `<TASK>`：待重试的任务 ID 或 Key

**选项**：
- `--hint <HINT>`：传递给新一轮尝试的补充提示或修复建议
- `--json`：强制以 JSON 格式输出
- `--role <ROLE>`：覆盖重试使用的角色
- `--agent <AGENT>`：覆盖重试使用的 ACP 智能体预设
- `--model <MODEL>`：覆盖重试使用的模型
- `--effort <EFFORT>`：覆盖重试使用的思考强度
- `--review-agent <REVIEW_AGENT>`：覆盖审查阶段的智能体
- `--review-model <REVIEW_MODEL>`：覆盖审查阶段的模型
- `--no-review`：本次重试跳过自动代码审查门禁
- `--fresh`：忽略上一轮会话上下文，以全新会话重试
- `--user-override`：经用户显式批准，绕过触发的审查硬熔断（`awaiting_user_decision`）
- `--override-reason <OVERRIDE_REASON>`：配合 `--user-override` 记录用户决策的审计备注
- `--run <RUN>`：指定所属 Run ID
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove roles

以只读方式查看当前已配置的 Drove 角色、对应模型以及路由策略。

```text
Usage: h2 drove roles [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 drove roles-ai-config

利用已配置的 AI 助手模型自动规划 Drove 角色分配、候选模型、擅长标签与路由说明。

```text
Usage: h2 drove roles-ai-config [OPTIONS]
```

**选项**：
- `--file <FILE>`：可选输入配置 JSON 文件
- `--json`：强制以 JSON 格式输出
- `--mode <MODE>`：配置范围，支持 `models`、`strengths`、`notes` 或 `all`
- `--instruction <INSTRUCTION>`：可选偏好指令，用于引导角色分配策略
- `--apply`：显式确认将 AI 生成的角色配置写入 `drove.json`
- `--dry-run`：仅预览生成结果，不保存到 `drove.json`
- `--language <LANGUAGE>`：擅长标签与理由说明的首选语言（如 `zh-CN` 或 `en`）
- `--on <MACHINE>`：指定目标远端机器
- `--consume`：读取 `--file` 后立即删除该文件
- `-h, --help`：显示帮助信息

## h2 drove route

对尚未开始执行（`pending` 或 `ready`）的任务动态覆盖其角色、智能体、模型、思考强度或目标 Worker 绑定。

```text
Usage: h2 drove route [OPTIONS] <TASK>
```

**参数**：
- `<TASK>`：目标任务 ID 或 Key

**选项**：
- `--json`：强制以 JSON 格式输出
- `--role <ROLE>`：覆盖分配的角色
- `--agent <AGENT>`：覆盖分配的 ACP 智能体
- `--model <MODEL>`：覆盖分配的模型
- `--effort <EFFORT>`：覆盖分配的思考强度
- `--worker <WORKER>`：指定绑定的 Worker
- `--run <RUN>`：指定所属 Run ID
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove runs

以只读方式列出 Drove Run 记录（命令别名：`h2 drove ls`）。

```text
Usage: h2 drove runs [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--trash`：查看回收站中的 Run，而非活跃/已完成 Run
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 drove send

向正在执行指定任务的 Worker 发送补充指导消息，或附带 `--interrupt` 打断其当前轮次。

```text
Usage: h2 drove send [OPTIONS] <TASK> <TEXT>
```

**参数**：
- `<TASK>`：目标任务 ID 或 Key
- `<TEXT>`：要发送的指导内容

**选项**：
- `--interrupt`：先中断 Worker 当前轮次再投递指导消息
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：指定所属 Run ID
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove settings

读取 Drove 当前配置、解析后的角色定义以及 AI 连接状态。

```text
Usage: h2 drove settings [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--section <SECTION>`：仅返回特定配置分组（`roles`、`agents`、`ai`、`magpie`、`config`）
- `--compact`：返回精简摘要，省略完整的探测模型列表
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove settings-set

从 JSON 文件更新 Drove 配置（可选在读取后立即删除临时文件）。

```text
Usage: h2 drove settings-set [OPTIONS] --file <FILE>
```

**选项**：
- `--file <FILE>`：包含 Drove 配置的 JSON 文件路径（必填）
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器
- `--consume`：读取后立即删除输入 JSON 文件（保护 API Key 安全）
- `-h, --help`：显示帮助信息

## h2 drove show

按 ID 查看某个 Run、Task（`tsk_...`）或 Message（`msg_...`）的完整快照。

```text
Usage: h2 drove show [OPTIONS] [ID]
```

**参数**：
- `[ID]`：Run ID、Task ID（`tsk_...`）或 Message ID（`msg_...`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN_ID>` 等价）
- `--full`：包含完整任务规格（`change`、`acceptance`、`constraints`），而非精简摘要
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove status

显示 Drove Web 服务状态、已配置角色、AI 助手状态以及当前活跃的 Run 列表。

```text
Usage: h2 drove status [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 drove use

设置后续 `h2 drove` 命令默认操作的活跃 Run ID。

```text
Usage: h2 drove use [OPTIONS] <RUN_ID>
```

**参数**：
- `<RUN_ID>`：要设为默认的 Run ID

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 drove wait

阻塞等待指定 Run 中出现未处理的协调器消息、任务失败或整个 Run 结束。

```text
Usage: h2 drove wait [OPTIONS] [RUN]
```

**参数**：
- `[RUN]`：Run ID（支持位置参数或 `--run`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：Run ID（与位置参数 `<RUN>` 等价）
- `--timeout <TIMEOUT>`：等待超时时间（秒，默认 `300`）
- `--since-seq <SINCE_SEQ>`：仅等待大于该事件序号的新变更（默认 `0`）
- `--on-task-done`（别名 `--on-change`）：只要有任意新任务进入终态即立即返回，不必等待整个 Run 结算
- `--full`：返回完整任务规格而非精简任务摘要
- `--on <MACHINE>`：指定目标远端机器
- `-h, --help`：显示帮助信息

## h2 drove web

打印 Drove Web UI 的访问链接，并默认在系统浏览器中打开。

```text
Usage: h2 drove web [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--run <RUN>`：预选并直达指定 Run ID（如 `run_...` 或 `machine/run_...`）
- `--on <MACHINE>`：指定目标远端机器
- `--no-open`：仅打印 URL，不自动启动浏览器
- `-h, --help`：显示帮助信息

## h2 drove worker

由 Drove 派生的 Worker ACP 会话在任务执行期间调用的内部协议子命令组。

```text
Usage: h2 drove worker [OPTIONS] <COMMAND>
```

**子命令**：
- `context`：从守护进程打印当前 Worker 与活跃 attempt 的上下文信息
- `inbox`：拉取并清空发给当前 Worker attempt 的未读便笺
- `ask`：向协调器发起阻塞式提问并等待打印回复
- `note`：向协调器发送非阻塞的进度汇报便笺
- `read`：读取前置依赖任务结果、验证日志或代码审查补丁片段
- `done`：向 Drove 守护进程门禁提交任务完成结果或显式失败报告

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 drove worker ask

Worker 向协调器发起阻塞提问并等待返回决策结果。

```text
Usage: h2 drove worker ask [OPTIONS] <QUESTION>
```

**参数**：
- `<QUESTION>`：要向协调器提出的问题文本

**选项**：
- `--json`：强制以 JSON 格式输出
- `--options <OPTIONS>`：供协调器选择的候选方案列表
- `--recommend <RECOMMEND>`：Worker 推荐的默认选项
- `--why <WHY>`：提问背景与推荐理由说明
- `--timeout <TIMEOUT>`：等待回复的超时秒数（默认 `300`）
- `--attempt <ATTEMPT>`：可选显式 attempt ID（默认使用当前 Worker 活跃的 attempt）
- `-h, --help`：显示帮助信息

## h2 drove worker context

从守护进程获取并打印当前 Worker 及其活跃 attempt 的任务上下文。

```text
Usage: h2 drove worker context [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 drove worker done

向 Drove 守护进程门禁（verify/review gate）提交当前任务 attempt 的完成状态或显式失败结果。

```text
Usage: h2 drove worker done [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--outcome <OUTCOME>`：提交结果状态（默认 `done`）
- `--summary <SUMMARY>`：本次任务完成或失败的简要总结
- `--reason <REASON>`：失败或中止时的原因说明
- `--data <DATA>`：附带的结构化输出数据
- `--files <FILES>`：涉及变更的关键文件列表
- `--no-retry`：标记失败后不再自动重试
- `--attempt <ATTEMPT>`：可选显式 attempt ID（默认使用当前 Worker 活跃的 attempt）
- `-h, --help`：显示帮助信息

## h2 drove worker inbox

拉取并消费发送给当前 Worker attempt 的所有未读指导便笺。

```text
Usage: h2 drove worker inbox [OPTIONS]
```

**选项**：
- `--attempt <ATTEMPT>`：可选显式 attempt ID（默认使用当前 Worker 活跃的 attempt）
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 drove worker note

向协调器发送一条非阻塞的阶段进度或状态说明便笺。

```text
Usage: h2 drove worker note [OPTIONS] <TEXT>
```

**参数**：
- `<TEXT>`：便笺正文内容

**选项**：
- `--json`：强制以 JSON 格式输出
- `--subject <SUBJECT>`：可选便笺主题标题
- `--attempt <ATTEMPT>`：可选显式 attempt ID（默认使用当前 Worker 活跃的 attempt）
- `-h, --help`：显示帮助信息

## h2 drove worker read

读取前置依赖任务的交付结果、验证日志或审查补丁切片。

```text
Usage: h2 drove worker read [OPTIONS] <TARGET>
```

**参数**：
- `<TARGET>`：要读取的依赖任务结果、日志或补丁目标标识

**选项**：
- `--json`：强制以 JSON 格式输出
- `--offset <OFFSET>`：读取起始字节/位置偏移（默认 `0`）
- `--limit <LIMIT>`：最大读取长度（默认 `65536`）
- `--grep <GREP>`：按关键词或模式过滤输出内容
- `--attempt <ATTEMPT>`：可选显式 attempt ID（默认使用当前 Worker 活跃的 attempt）
- `-h, --help`：显示帮助信息

## h2 events

实时订阅 Core 运行时的事实变更事件流（智能体、终端状态变化、Transcript 条目与文档更新；管道输出时每行一条 JSON）。

```text
Usage: h2 events [OPTIONS]
```

**选项**：
- `--agent <AGENT>`：仅监听指定智能体的事件
- `--json`：强制以 JSON 格式输出
- `--terminal <TERMINAL>`：仅监听指定终端的事件
- `--children-of <CHILDREN_OF>`：仅监听指定智能体或终端的子代事件
- `--label <K=V>`：仅监听同时包含这些标签的记录（可重复指定）
- `--doc <NAME>`：按名称订阅文档变更（可重复指定，以 `*` 结尾表示前缀匹配；若仅指定 `--doc` 则只接收文档事件，需同时指定智能体或终端才能兼收两者）
- `-h, --help`：显示帮助信息

## h2 exec

在本机或指定远端机器上直接执行非智能体普通命令（不经 Shell 包装），精确捕获 stdout、stderr 与退出码。

```text
Usage: h2 exec [OPTIONS] <ARGV>...
```

**参数**：
- `<ARGV>...`：程序与参数列表，按原样直接执行（不经过 Shell 解析）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：在指定远端机器上执行（参见 `h2 machine ls`）
- `--cwd <CWD>`：工作目录（默认 CLI 所在目录；通过 API 调用时为 Core 工作目录；带 `--on` 时为远端家目录）
- `--env <K=V>`：在 Core 环境变量之上叠加的 `key=value`（可重复指定）
- `--timeout <TIMEOUT>`：超时秒数，超时后连同其派生进程一并终止（默认 `60`，最大 `600`）
- `-i, --stdin`：将管道传入 `h2` 的标准输入转发给目标命令
- `-h, --help`：显示帮助信息

## h2 file

在本机或远端机器上安全读取、从标准输入原子写入或精准编辑文本文件。

```text
Usage: h2 file [OPTIONS] <COMMAND>
```

**子命令**：
- `read`：读取文本文件全部内容或指定行范围（`--offset`、`--limit`）
- `write`：将标准输入内容原子写入目标文件，自动创建缺失的父目录
- `edit`：执行唯一精确文本替换（`--old X --new Y`，可重复成对指定，全部成功或全部回滚）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 file edit

对文件执行精确文本替换；每条 `--old` 必须在文件中唯一出现，多组替换满足全成功或全不改的原子性。

```text
Usage: h2 file edit [OPTIONS] --old <OLD> --new <NEW> <PATH>
```

**参数**：
- `<PATH>`：目标文件路径（绝对路径或相对 `--cwd`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：在指定远端机器上执行（参见 `h2 machine ls`）
- `--cwd <CWD>`：相对路径基准目录（默认当前目录；带 `--on` 时为远端家目录）
- `--old <OLD>`：待替换的精确原文，必须在文件中仅出现一次（可重复，按顺序与 `--new` 配对）
- `--new <NEW>`：替换后的新文本
- `-h, --help`：显示帮助信息

## h2 file read

输出文本文件内容，或通过 `--offset` 与 `--limit` 按行分页读取。

```text
Usage: h2 file read [OPTIONS] <PATH>
```

**参数**：
- `<PATH>`：目标文件路径（绝对路径或相对 `--cwd`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：在指定远端机器上执行（参见 `h2 machine ls`）
- `--cwd <CWD>`：相对路径基准目录（默认当前目录；带 `--on` 时为远端家目录）
- `--offset <OFFSET>`：起始行号（从 `1` 开始）
- `--limit <LIMIT>`：最多读取的行数（默认读取全部，上限 `8 MB`）
- `-h, --help`：显示帮助信息

## h2 file write

将通过管道传入标准输入（stdin）的内容写入目标文件，若父目录不存在则自动创建。

```text
Usage: h2 file write [OPTIONS] <PATH>
```

**参数**：
- `<PATH>`：目标文件路径（绝对路径或相对 `--cwd`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：在指定远端机器上执行（参见 `h2 machine ls`）
- `--cwd <CWD>`：相对路径基准目录（默认当前目录；带 `--on` 时为远端家目录）
- `-h, --help`：显示帮助信息

## h2 get

查看单个智能体或终端的完整状态记录（含状态、轮次、收件箱队列、挂起权限、配置项、标签与会话血统等）。

```text
Usage: h2 get [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 handoff

在无头 ACP 智能体（`a*`）与交互式 PTY 终端（`t*`）之间执行上下文接力（`handoff`）、独立分支分叉（`fork`）、旁路讨论（`side-chat`）或合入回传（`--into` / `send-context`）。

```text
Usage: h2 handoff [OPTIONS] <SOURCE> [ARGV]...
```

**参数**：
- `<SOURCE>`：源智能体或终端（`a1`、`t1`、名称或 `machine/a1`）
- `[ARGV]...`：使用 `--pty` 启动目标或运行自定义 ACP 命令时显式指定的命令与参数

**选项**：
- `--json`：强制以 JSON 格式输出
- `--kind <KIND>`：交接血统类型（默认 `handoff`）：
  - `handoff`：在新智能体或不同 Provider 中延续同一条工作脉络
  - `fork`：从指定轮次/状态分叉，独立探索或重新实现
  - `side-chat`：开启临时旁路讨论，不替代主会话
  - `send-context`：将近期会话上下文直接转发到另一个当前存活的会话
- `--preset <AGENT>`：目标智能体预设/程序（如 `claude`、`codex`、`gemini`、`agy` 等）
- `--pty`：启动交互式 PTY 终端（`t*`）作为目标，而非无头 ACP（`a*`）
- `--into <TARGET>`：将增量摘要/结论投递到已有的智能体或终端，而非新建节点
- `--from-turn <FROM_TURN>`：包含源会话记录的起始轮次（从 1 开始，闭区间）
- `--to-turn <TO_TURN>`：包含源会话记录的结束轮次（从 1 开始，闭区间）
- `--recent-turns <N>`：仅包含源会话最近 `N` 轮（设置 `--from-turn` 时忽略；`0` 表示全部）
- `--max-bytes <BYTES>`：生成交接上下文包的最大字节预算（默认 `24 KiB`）
- `--prompt <TEXT>`：暂存交接上下文后立即发送的可选首轮指令
- `--note <TEXT>`：写入交接包头部的简短用户备注
- `--cwd <CWD>`：覆盖目标工作目录（默认继承源智能体/终端的 `cwd`）
- `--name <NAME>`：为新派生的目标指定唯一名称
- `--model <MODEL>`：为新派生的 ACP 或 PTY 目标覆盖模型
- `--effort <EFFORT>`：为新派生目标覆盖思考强度（`low`、`medium`、`high`、`xhigh`、`max`）
- `--keep`：标记新派生目标在重启后保持恢复（同 `h2 keep`）
- `--worktree`：当 `--kind fork` 时，自动在独立分支上创建隔离 Git Worktree（携带未提交改动），便于分叉会话自由提交
- `--merge-worktree`：配合 `--into` 合入回传时，指示目标/父智能体将源分叉 Worktree 分支上的代码合入主工作区（不删除 Worktree 与分支）
- `--raw`：跳过语义记忆蒸馏与合入要点压缩，直接发送有界原始轮次内容
- `--wait`：配合 `--prompt` 使用，等待目标完成首轮响应
- `--timeout <TIMEOUT>`：配合 `--wait` 使用的提前返回超时秒数（默认取配置，否则 `180`）
- `--cols <COLS>`：使用 `--pty` 派生终端时的初始列数
- `--rows <ROWS>`：使用 `--pty` 派生终端时的初始行数
- `-h, --help`：显示帮助信息

## h2 inbox

查看、编辑、删除或立即发送排队在 ACP 智能体串行收件箱中的待执行提示词。

```text
Usage: h2 inbox [OPTIONS] <COMMAND>
```

**子命令**：
- `ls`：列出智能体收件箱中排队等待执行的提示词
- `edit`：在排队提示词尚未开始执行前修改其文本内容
- `rm`：移除尚未开始执行的排队提示词
- `send`：必要时打断当前活跃轮次，并立即发送指定的排队提示词
- `resume`：将跨重启/重连保留的暂停提示词重新入队并恢复投递
- `clear-paused`：丢弃跨重启/重连保留的暂停提示词

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox clear-paused

丢弃在守护进程重启或系统重启后被暂停保留的收件箱提示词。

```text
Usage: h2 inbox clear-paused [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox edit

修改 ACP 收件箱中某条尚未开始执行的排队提示词内容。

```text
Usage: h2 inbox edit [OPTIONS] <AGENT> <ID> <TEXT>
```

**参数**：
- `<AGENT>`：目标智能体地址（`a7`、名称或 `machine/a7`）
- `<ID>`：排队条目 ID（可通过 `h2 get` 的 `inbox[].id` 或 `h2 inbox ls` 查看）
- `<TEXT>`：替换后的新提示词文本

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox ls

列出指定 ACP 智能体收件箱中当前排队等待执行的提示词列表。

```text
Usage: h2 inbox ls [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox resume

将在守护进程或系统重启期间暂停保留的收件箱提示词重新入队并恢复投递。

```text
Usage: h2 inbox resume [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体地址（`a7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox rm

在排队提示词尚未进入执行前将其从 ACP 收件箱中移除。

```text
Usage: h2 inbox rm [OPTIONS] <AGENT> <ID>
```

**参数**：
- `<AGENT>`：目标智能体地址（`a7`、名称或 `machine/a7`）
- `<ID>`：排队条目 ID（来自 `h2 get` 的 `inbox[].id`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 inbox send

如有需要则中断当前正在执行的轮次，并立刻将指定的排队提示词提至队首发送。

```text
Usage: h2 inbox send [OPTIONS] <AGENT> <ID>
```

**参数**：
- `<AGENT>`：目标智能体地址（`a7`、名称或 `machine/a7`）
- `<ID>`：排队条目 ID（来自 `h2 get` 的 `inbox[].id`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 interrupt

向 ACP 智能体发送 `session/cancel`（或向 PTY 终端发送 `Esc` / `Ctrl-C` 中断控制）以在干净边界停止当前轮次。

```text
Usage: h2 interrupt [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--timeout <TIMEOUT>`：等待取消生效的超时秒数（默认 `10`）
- `-h, --help`：显示帮助信息

## h2 keep

设置存活智能体或终端在崩溃或计划重启后是否自动恢复（ACP 走 `session/load`，传入 `--off` 关闭保活）。

```text
Usage: h2 keep [OPTIONS] <AGENT>
```

**参数**：
- `<AGENT>`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--off`：关闭崩溃或重启后的自动恢复标记
- `-h, --help`：显示帮助信息

## h2 keys

向存活的交互式 PTY 终端发送命名按键或组合键序列。

```text
Usage: h2 keys [OPTIONS] <TERMINAL> <KEYS>...
```

**参数**：
- `<TERMINAL>`：目标终端地址（`t7`、名称或 `machine/t7`）
- `<KEYS>...`：按键名称序列，例如 `enter`、`esc`、`tab`、`up`、`ctrl+c`、`alt+x`、`f5`、`a` 等

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 kill

结束指定的 ACP 智能体或 PTY 终端进程（先发送 HUP/优雅终止信号，再按需升级强杀）。

```text
Usage: h2 kill [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 label

为智能体或终端设置或移除自定义键值标签（`key=value` 设置，`key=` 移除对应键）。

```text
Usage: h2 label [OPTIONS] <AGENT> <K=V>...
```

**参数**：
- `<AGENT>`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）
- `<K=V>...`：要设置的标签对 `key=value`；`key=` 表示清除该标签

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 ls

列出当前存活的 ACP 智能体与工作区终端（以及已连接远端机器上的节点）。

```text
Usage: h2 ls [OPTIONS]
```

**选项**：
- `--all`：同时包含已结束的智能体与终端记录
- `--json`：强制以 JSON 格式输出
- `--label <K=V>`：仅显示同时包含这些标签的记录（可重复指定）
- `-h, --help`：显示帮助信息

## h2 machine

管理通过 SSH 或自定义 `--via` 传输命令接入的远端联邦机器。

```text
Usage: h2 machine [OPTIONS] <COMMAND>
```

**子命令**：
- `add`：添加一台通过 SSH 或 `--via` 连接的远端机器（如 `h2 machine add vps`）
- `ls`：列出本地已添加的所有远端机器及连接状态
- `login`：当远端提示需要重新认证（密码或验证码）时重新登录；Windows 上在 SSH 密钥就绪后重新建立连接
- `update`：将本机当前 `h2` 二进制同步到远端并平滑重启远端 `h2`
- `rename`：在本地为远端机器重命名
- `rm`：移除本地对远端机器的记录（不会终止远端正在运行的智能体）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 machine add

添加一台可通过 SSH 或自定义通道访问的远端机器，接入后即可使用 `--on <name>` 与 `<name>/a7` 地址跨机调度。

```text
Usage: h2 machine add [OPTIONS] [TARGET]
```

**参数**：
- `[TARGET]`：SSH 连接目标，例如 `vps`、`can@10.0.0.7`、`can@10.0.0.7:2222` 或 `~/.ssh/config` 中定义的 Host

**选项**：
- `--json`：强制以 JSON 格式输出
- `--via <COMMAND>`：使用自定义命令替代默认 `ssh` 连接；该命令需像 `ssh` 一样接受远端 Shell 命令作为最后一个参数（如 `ssh -p 2222 -i key user@ip` 或 `fly ssh console -a app --pty=false -C`）
- `--temp`：将其标记为临时机器（如单次任务沙箱），便于客户端与长期机器区分显示；移除方式同样使用 `h2 machine rm`
- `--install`：当远端未安装 `h2` 或版本过旧时，自动将本机 `h2` 复制过去而不交互询问
- `--name <NAME>`：该机器在本机的简称（默认取目标主机名）
- `--session <SESSION>`：指定连接远端的 `h2` 会话名（默认使用远端默认会话）
- `-h, --help`：显示帮助信息

## h2 machine login

当远端机器提示需要再次输入密码、二次验证码或重新握手时执行登录重连（Windows 下在 SSH 密钥配置生效后用于重新拉起连接）。

```text
Usage: h2 machine login [OPTIONS] <MACHINE>
```

**参数**：
- `<MACHINE>`：远端机器名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 machine ls

列出当前已添加的所有远端机器及其在线/鉴权状态。

```text
Usage: h2 machine ls [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 machine rename

修改本地保存的远端机器简称。注意：改名后，使用旧名称前缀的地址将不再生效。

```text
Usage: h2 machine rename [OPTIONS] <MACHINE> <NEW_NAME>
```

**参数**：
- `<MACHINE>`：远端机器当前的名称
- `<NEW_NAME>`：新的机器名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 machine rm

从本地移除指定远端机器的连接配置（不会影响远端机器上正在运行的智能体进程）。

```text
Usage: h2 machine rm [OPTIONS] <MACHINE>
```

**参数**：
- `<MACHINE>`：远端机器名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 machine update

将本机的 `h2` 二进制部署到指定远端机器并平滑重启远端 Core 守护进程。

```text
Usage: h2 machine update [OPTIONS] <MACHINE>
```

**参数**：
- `<MACHINE>`：远端机器名称

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 mcp

启动 Herdr2 内置的 stdio MCP 服务器（供 ACP 子智能体自动注入或由外部编码 CLI 手动挂载，暴露 `h2_run`、`h2_send`、`h2_wait`、`h2_read`、`h2_ls`、`h2_approve`、`h2_deny`、`h2_handoff` 等工具）。

```text
Usage: h2 mcp [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 put

将本地文件暂存复制到存活智能体或终端所在机器的相邻暂存区，并在标准输出打印远端可直接访问的路径（保留原文件扩展名，如 `.png`）。

```text
Usage: h2 put [OPTIONS] <AGENT> <FILE>
```

**参数**：
- `<AGENT>`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）
- `<FILE>`：要发送的本地文件路径（保留文件名与扩展名）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 read

输出 ACP 智能体的结构化会话记录或最新一轮最终回复（`--last`），或读取交互式 PTY 终端的屏幕与滚动历史。

```text
Usage: h2 read [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `--lines <LINES>`：仅输出尾部指定行数的渲染文本（默认输出全部）
- `--last`：仅打印最近一轮的最终助手回复文本
- `--wait`：读取前先等待智能体结束当前轮次或进入阻塞状态
- `--timeout <TIMEOUT>`：配合 `--wait` 使用的提前返回超时秒数（默认取配置，否则 `180`）
- `--from-turn <FROM_TURN>`：按轮次切片读取的起始轮次（从 1 开始，闭区间）
- `--to-turn <TO_TURN>`：按轮次切片读取的结束轮次（从 1 开始，闭区间）
- `-h, --help`：显示帮助信息

## h2 rm

删除已结束的智能体或终端记录，清理注册表条目。

```text
Usage: h2 rm [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：已结束的智能体或终端（`a7`、`t7`、名称或 `machine/a7`）

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 run

启动一个无头 ACP 子智能体（支持内置 `--agent` 预设、自定义命令行或 `~/.config/herdr2/templates` 模板），例如 `h2 run claude "fix tests"`。

```text
Usage: h2 run [OPTIONS] [ARGV]...
```

**参数**：
- `[ARGV]...`：预设/命令及参数，或模板名称及其任务说明

**选项**：
- `--agent <AGENT>`：ACP 预设名称（`claude`、`codex`、`gemini` 等）或显式命令行
- `--json`：强制以 JSON 格式输出
- `--prompt <TEXT>`：ACP 会话就绪后立即入队的首条提示词
- `--system-prompt <TEXT>`：在创建会话时通过 `_meta.systemPrompt` 附加的系统提示词
- `--model <MODEL>`：通过 `session/set_config_option`（`model`）覆盖使用的模型
- `--effort <EFFORT>`：通过 `session/set_config_option`（`reasoning_effort` / `thought_level`）覆盖思考强度
- `--mode <MODE>`：通过 `session/set_mode` 覆盖会话模式
- `--permissions <MODE>`：覆盖权限审批策略，可选 `approve-all`、`approve-reads`（默认）、`deny-all`、`ask`（也兼容 `dangerously-skip-permissions`）
- `--dangerously-skip-permissions`：跳过所有权限检查（同时应用 `approve-all` 策略并在适配器支持时切换到 `bypassPermissions` 会话模式）
- `--no-mcp`：禁用向 `mcpServers` 自动注入内置 `herdr2` MCP 服务器
- `--name <NAME>`：在当前存活节点中唯一的名称（1–32 个字符，允许 `a-z`、`0-9`、`-`、`_`）
- `--cwd <CWD>`：工作目录（默认 CLI 所在目录；经 API 调用为 Core 目录；带 `--on` 时为远端家目录）
- `--on <MACHINE>`：在指定远端机器上运行（参见 `h2 machine ls`），返回地址格式为 `machine/a7`
- `--label <K=V>`：初始标签 `key=value`（可重复指定）
- `--parent <PARENT>`：显式指定父智能体/终端（默认自动关联发起调用的父节点）
- `--no-parent`：不绑定父节点，即使从其他智能体或终端内发起
- `--no-notify`：不向父节点自动发送状态变更通知便笺
- `--outlive-parent`：父节点结束时保持运行（默认随父节点一并清理）
- `--rm`：进程退出且等待中的父节点获知后自动移除记录
- `--keep`：崩溃或 Core 重启后通过 `session/load`（若支持）自动恢复
- `--bg`：后台启动并立即返回，不等待首轮结束
- `--timeout <TIMEOUT>`：前台等待的检查超时秒数，超时后提前返回但保持智能体继续运行（默认取配置 `wait_timeout`，否则 `180`）
- `-h, --help`：显示帮助信息

## h2 schema

输出完整的 OpenRPC 1.3.2 JSON Schema（包含所有 RPC 方法与数据结构定义），供桌面端、脚本与第三方客户端开发者参考。

```text
Usage: h2 schema [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 send

向 ACP 智能体的串行收件箱排队发送提示词或多模态附件（传入 `--steer` 可打断当前轮并插队执行），或向交互式 PTY 终端安全粘贴输入。

```text
Usage: h2 send [OPTIONS] <AGENT> [TEXT]
```

**参数**：
- `<AGENT>`：目标智能体或终端（`a7`、`t7`、名称或 `machine/a7`）
- `[TEXT]`：入队的提示词文本（当通过 `--image`/`--resource`/`content` 发送内容时可省略）

**选项**：
- `--image <FILE>`：附加一个或多个本地图片文件（PNG/JPEG/WebP/GIF/SVG，≤ 8 MB）作为原生 ACP 图像内容块
- `--json`：强制以 JSON 格式输出
- `--resource <FILE>`：附加一个或多个本地文件作为 ACP 内嵌资源块（文本或二进制 ≤ 8 MB）
- `--resource-link <URI>`：附加一个或多个 URI 或文件路径作为 ACP `resource_link` 块
- `--steer`：发送 ACP `session/cancel` 中断当前活跃轮次，并将本条消息插队立即执行
- `--if <STATUS>`：仅当目标当前状态恰好匹配时才入队（可选：`idle`、`working`）
- `--wait`：等待本次发送触发的回合执行完毕
- `--timeout <TIMEOUT>`：配合 `--wait` 使用的超时秒数（默认取配置，否则 `180`）
- `--from <FROM>`：自定义 `<h2 from="...">` 信封中标注的发送方地址（默认为当前调用方）
- `-h, --help`：显示帮助信息

## h2 server

启动、停止、检查状态或平滑重启后台 `herdr2` Core 运行时守护进程。

```text
Usage: h2 server [OPTIONS] <COMMAND>
```

**子命令**：
- `start`：启动后台 Core 守护进程
- `stop`：停止后台 Core 守护进程
- `status`：查看守护进程运行状态、监听路径与版本信息
- `restart`：平滑重启守护进程（如升级二进制后），已标记 `--keep` 的智能体会通过 `session/load` 自动恢复，托管终端保持存活

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 server restart

平滑重启后台 Core 守护进程（常用于更新二进制之后）；已标记 `--keep` 的 ACP 智能体会尝试通过 `session/load` 恢复。

```text
Usage: h2 server restart [OPTIONS]
```

**选项**：
- `--fresh`：采用当前 Shell 的环境变量供后续新建智能体继承（建议在普通外部终端中运行）
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 server start

启动后台 Core 守护进程（若已在运行则保持幂等）。

```text
Usage: h2 server start [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 server status

查看后台 Core 守护进程是否在线、进程 PID、会话套接字路径与运行状态。

```text
Usage: h2 server status [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 server stop

停止当前会话对应的后台 Core 守护进程。

```text
Usage: h2 server stop [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 skill

自动检测本机或远端已安装的编码智能体（如 Claude Code、Codex、Cursor、OpenCode、Antigravity、Windsurf 等），并安装或更新内置 Herdr2 配套技能包。

```text
Usage: h2 skill [OPTIONS] <COMMAND>
```

**子命令**：
- `status`：检查已检测到的编码智能体技能目录及已安装的 Herdr2 技能版本
- `install`：安装或更新内置 Herdr2 配套技能（`herdr2`、`drove`、`drove-add`、`drove-setup`）
- `ai-install`：调用内置 Core AI 智能识别本机或远端编码智能体并自动完成技能安装

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 skill ai-install

调用内置 Core AI 检查本机或远端环境中的编码智能体目录布局，并自动规划与安装 Herdr2 配套技能。

```text
Usage: h2 skill ai-install [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--query <TEXT>`：可选提示，说明自定义智能体名称或期望的技能安装路径
- `--lang <LANG>`：首选说明语言（`zh-CN` 或 `en`）
- `--dry-run`：仅输出安装规划方案，不向磁盘写入任何技能文件
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 skill install

安装或更新内置的 Herdr2 配套技能（`herdr2`、`drove`、`drove-add`、`drove-setup`）到对应编码智能体的技能目录。

```text
Usage: h2 skill install [OPTIONS]
```

**选项**：
- `--all`：安装到所有已检测到的编码智能体技能目录
- `--json`：强制以 JSON 格式输出
- `--detected-only`：仅安装到磁盘或 `PATH` 中实际检测到的智能体（不创建回退目录）
- `--agent <AGENT>`：指定单个已知智能体 ID（`antigravity`、`claude`、`codex`、`cursor`、`opencode`、`windsurf`）
- `--target <DIR>`：指定自定义的技能根目录路径
- `--skills <SKILLS>`：逗号分隔的技能子集（默认安装全部内置技能）
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 skill status

检查本机或远端机器上已检测到的编码智能体技能目录，以及各目录中已安装的 Herdr2 技能版本状态。

```text
Usage: h2 skill status [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `--on <MACHINE>`：指定目标远端机器（参见 `h2 machine ls`）
- `-h, --help`：显示帮助信息

## h2 templates

列出 `~/.config/herdr2/templates` 目录下可通过 `h2 run <template> [task]` 按名称直接启动的任务模板。

```text
Usage: h2 templates [OPTIONS]
```

**选项**：
- `--json`：强制以 JSON 格式输出
- `-h, --help`：显示帮助信息

## h2 update

将当前 `h2` 替换为新版本或指定的本地二进制文件，并平滑重启后台 Core 守护进程。

```text
Usage: h2 update [OPTIONS]
```

**选项**：
- `--from <FILE>`：指定用于替换的本地 `herdr2` 二进制文件（默认自动下载最新 Release）
- `--json`：强制以 JSON 格式输出
- `--version <X.Y.Z>`：要求至少升级到该版本（例如 `0.1.4`）；若当前版本已满足或更新则不执行变更
- `--force`：强制允许降级到旧版本（注意持久化状态仅向前兼容）或跨协议代际版本替换
- `-h, --help`：显示帮助信息

## h2 wait

等待单个智能体/终端退出 `working` 状态，或等待子代节点变化（`--children any|all`）；在等待期间若收到发给当前调用方的消息，也会立即唤醒返回。

```text
Usage: h2 wait [OPTIONS] [AGENT]
```

**参数**：
- `[AGENT]`：目标智能体/终端；配合 `--children` 使用时表示监听其子代的父节点（默认为当前调用方）

**选项**：
- `--children <CHILDREN>`：改为等待子代状态变化：`all` 表示等到所有子代都不再处于 `working`，`any` 表示有任意子代新动态或收到发给你的消息即返回（可选：`any`、`all`）
- `--json`：强制以 JSON 格式输出
- `--output <OUTPUT>`：当开始等待后的流式会话输出包含指定文本时即结束等待（遇到 `blocked`、`error` 或退出也会结束）
- `--timeout <TIMEOUT>`：阶段性回报超时秒数（默认取配置 `wait_timeout`，否则 `180`）
- `--no-timeout`：无限期等待直到状态变化、退出、命中输出或收到消息（适用于后台长期监听）
- `-h, --help`：显示帮助信息
