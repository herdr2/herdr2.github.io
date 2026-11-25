---
title: "跨 Provider 上下文接力与统一会话血统"
description: "Context Handoff、Worktree Fork 与会话血统（Session Lineage）的架构设计与实现细节。"
---
## 1. 目标与总体架构

在 `herdr2`（`herdr-core` + `herdr-app`）中落地 T3 Code Orchestration V2 最具实用价值的 20% 能力：
- **跨 Provider 上下文接力（Handoff / Fork / Side Chat / Merge Back）**：支持无头 ACP Agent（`a*`）与交互式 PTY 终端 Agent（`t*`）之间任意组合交接上下文（`a* / t* -> 新 a* / 新 t* / --into 已有 a*|t*`）。
- **轻量级统一会话血统（Lineage）**：在 `Agent`、`Terminal`、Drove `Worker`/`Assign` 及转录条目（`Entry::Handoff`）中记录父子/分支/合入来源，不引入重型事件溯源数据库，直接复用现有文件状态与工作树模型。
- **Drove 自动失败兜底交接（Fallback Retry Handover）**：当 Drove DAG 任务重试（`retry_of`）或切换 Provider 兜底执行时，自动提取上一轮尝试的工作轨迹、失败原因与变更摘要注入新 Worker，同时保留手动触发与 UI 交接入口。

---

## 2. 核心设计与分步实施

### Step 1：数据模型、转录增强与确定性上下文打包器（`herdr-core`）

1. **`api/types.rs` 与 `pty_transcript.rs`**
   - 在 `ReadSessionMeta` 新增 `provider: Option<String>` 与 `session_id: Option<String>`，并在 Claude / Codex / Gemini / Pi / Agy 等 CLI 转录解析器中提取真实 Provider 与底层 `session_id`。
   - 为 `ReadParams` 新增 `--from-turn` / `--to-turn`（按 Turn 范围切片读取，供被接力的 Agent 自助按需回查被省略的历史轮次）。
2. **`transcript.rs`**
   - 新增 `Entry::Handoff { kind, from_address, from_provider, from_session_id, from_turns, artifact_path, ts_ms }`，完善 `turn()`、`approx_bytes()`、`render_line()`。
   - 扩展 `strip_h2_envelope` 过滤 `<herdr2-handoff ...>...</herdr2-handoff>` 内部信封标签。
   - 新增按 Turn 范围切片辅助方法 `slice_turn_range`。
3. **`src/handoff.rs`（新建并在 `src/lib.rs` 导出）**
   - 定义 `LineageKind`（`Handoff` / `Fork` / `SideChat`）、`Lineage`、`HandoffPackage`。
   - 实现有界确定性上下文打包器 `build_handoff_package`（默认 24 KiB 上限）：
     - 保留 Turn 1 原始目标 + 当前 `git status --short` + 计划/最新摘要；
     - 从最新 Turn 倒序填充对话/关键产物；
     - 对超预算被折叠的中间 Turn，自动生成 `h2 read <source> --from-turn X --to-turn Y` 自助回查指引。
   - 实现 `default_pty_argv` 与单元测试。
4. **`agents.rs`、`terminals.rs`、`api.rs`、`mcp.rs`**
   - 为 `Agent` / `NewAgent` / `Terminal` / `NewTerminal` 增加 `lineage: Option<Lineage>`。
   - 在 `agent_read` 与 `h2_read` MCP 工具中落地 `--from-turn` / `--to-turn` 过滤读取（兼容 `a*` 与 `t*`）。

---

### Step 2：统一 `agent.handoff` RPC、CLI、MCP 与混合投递路径

- **`api/handoff.rs` + `api/types.rs` + `api.rs`**
  - 新增 `HandoffParams`、`HandoffResult`（注意：避免任何名为 `first_message` 的字段以符合 `m0` OpenRPC 契约测试）并注册 `"agent.handoff"` RPC。
  - 区分目标类型执行双轨投递：
    1. **目标为无头 ACP（`a*`）**：将完整 Handoff 包写入 `TargetCheckpoints.pending_handoff`（由 `acp/mod.rs::prepare_acp_prompt` 在第 1 轮自动前置注入，不污染用户可见首条消息），并写入 `Entry::Handoff`（Turn 0）；若提供 `prompt` 则立即发起首轮运行。
    2. **目标为交互式 PTY（`t*`）**：**绝不使用 `tc.pending_handoff`**（避免与 Agy 回滚提示冲突），也**绝不覆写已有运行中的 PTY 窗格**：
       - 同 Provider CLI 原生 `Fork`（如 Claude / Codex 且解析到 `session_id`）：优先复用 `pty_adapters::{fork_claude_jsonl, fork_codex_jsonl}` 复制到指定 Turn 的新会话文件并以 `--resume <fork_uuid>` / `codex resume <fork_uuid>` 拉起；
       - 跨 Provider / 常规接力：通过 `put::stage_terminal` 将完整 `handoff.md` 落盘到目标终端暂存区，再注入简短双行文件路径提示引导其阅读。
    3. **`--into <target>` 合入模式（含 `merge_back`）**：从当前节点最近 Turn（或自上次分叉后的增量 Turn 范围）提取结论，生成轻量增量交接，安全投递至已有 `a*` 或以文件指针投递至已有 `t*`（若为 PTY 目标，不清空/重启原有进程）。
- **`remote.rs`、`cli.rs`、`cli/output.rs`、`mcp.rs`、`help.txt`、`SKILL.md`**
  - 将 `"agent.handoff"` 接入远程转发允许列表、`h2 handoff` CLI 子命令、`h2_handoff` MCP 工具、`lineage` 状态展示以及帮助手册/技能文档。
  - 更新 OpenRPC schema（`schema/h2.openrpc.json`）与 CLI 命令文档（`docs/commands.md`），补充 `tests/handoff.rs` 集成测试。

---

### Step 3：Drove DAG 自动失败兜底交接（Fallback Retry Handover）

- **`drove/protocol.rs` 与 `drove/pool.rs`**
  - 新增 `PriorAttemptHandover` 与 `build_task_prompt_with_handover`。
  - 当 DAG 任务发生重试（`retry_of`）并调度至新 Worker（或降级到备用 Provider）时，`build_attempt_handover` 从前一次尝试的 `WorkerItem` 日志提取失败原因、已执行轨迹与输出尾部摘要注入 Prompt，同时在 `Worker.forked_from` 与 `Assign.fork` 记录血统关系。

---

### Step 4：桌面端 UI 集成（`herdr-app`）

- **`src/commands.rs`、`src/hc.rs`、`src/window.rs`、`defaults/AGENTS.md`**
  - 注册并透传 `agent.handoff` 命令，更新 `AGENTS.md` 命令说明以通过文档校验测试。
- **新建 `defaults/mods/handoff/{mod.json,main.js}`（双语 `en` / `zh-CN`）**
  - 提供交接弹窗：模式选择（`Handoff` 接力 / `Fork` 分支 / `Side Chat` 旁路讨论 / `Merge back` 回合）、目标运行时（`CLI` / `ACP`）、Preset 与打开布局（`Split Right` / `New Tab` / `Peek`）。
- **现有模块联动**
  - `defaults/mods/menu/main.js`：右键与操作菜单增加 Handoff / Fork / Side Chat / Merge back 入口。
  - `defaults/mods/pane/main.js`：Pane 头部展示可点击 `↳ <source>` 血统徽章与悬停快捷按钮。
  - `defaults/mods/peek/{acp_model.js,main.js}`：解析并渲染 `Entry::Handoff` 横幅卡片及头部血统跳转 / `Merge back` 操作。

---

## 3. 验证计划

- **`herdr-core` 验证**：
  - `H2_UPDATE_SCHEMA=1 cargo test --locked -p herdr2 --test m0`
  - `sh scripts/docs.sh --write`
  - `cargo clippy --locked --all-targets -- -D warnings`
  - `cargo test --locked -p herdr2 --lib`
  - `cargo test --locked -p herdr2 --test m0 --test cli_docs --test skill --test handoff --test checkpoints --test acp_mcp --test drove`
- **`herdr-app` 验证**：
  - `cargo build --locked`
  - `bun scripts/docs.ts generate`
  - `bun test scripts/docs.test.ts scripts/peek.test.ts scripts/changes.test.ts scripts/agents.test.ts scripts/tabs.test.ts scripts/palette.test.ts`
  - `cargo test --locked`
