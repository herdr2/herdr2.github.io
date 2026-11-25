---
title: "Drove 编排引擎架构说明"
description: "Drove 原生多智能体 DAG 编排器在 herdr-core、herdr-app 与 drove-web 中的架构设计。"
---
**Drove** 是内置于 `herdr2`（`herdr-core/crates/herdr2/src/drove/`）的原生多智能体 DAG 编排引擎，将单守护进程 Rust 执行内核、Herdr2 桌面端控制面（`herdr-app`）与只读宏观观测工作台（`drove-web/`）融为一体。

---

## 1. 单守护进程设计（零外部 Node / acpx 进程）

所有编排逻辑直接运行在现有 `herdr2` 后台守护进程（`DroveRuntime`）内部：

- **状态与密钥目录（`~/.local/state/herdr2/<session>/drove/`）**：
  - `state.json`：原子持久化的编排状态，涵盖 Runs、Tasks、Workers、Attempts、Messages 与 DaemonEvents（`store.rs`）。
  - `items/<worker_id>.jsonl`：仅追加写入的 Worker 实时事件流，通过 SSE 推送到前端。
  - `secrets/`（权限 `0700`）：保存 `ai.key`（`0600`）和 `coordinator.token`（`0600`）；另有 `artifacts/` 目录存放 `verify-*` 验收日志与 `review-*.patch` 审查补丁。
- **配置文件（`~/.config/herdr2/drove.json`）**：
  - 存储角色绑定（`coder`、`tester`、`writer`、`reviewer`、`researcher` 及自定义角色）、极简 AI 助手配置（`enabled`、`baseUrl`、`model` 与策略开关——原始 API Key 绝不写入此文件），以及可选的 `magpie` 额度查询开关（默认 `enabled: false`）。
- **Worker 进程池与左下角智能体树（`pool.rs`、`api/run.rs`）**：
  - 每个 Drove Worker 均通过 `Core` 直接派生为无头 ACP `a*` 子智能体（`name: None`、`notify: false`、`inject_mcp: false`、`dangerously_skip_permissions: true`，`parent` 指向编排者 `t*` 或 `a*`）。
  - 实时展示文本结合 `a.title` 与 `labels["drove.display"]`（忙碌时显示 `"<role> · <task_key>"`，热待命时显示 `"<role> · idle"`），使 `herdr-app` 左下角 **智能体（Agents）** 树能够原生分组呈现 Worker 车队，同时避免触发 `Agent.name` 的唯一性或字符集限制。
  - 任务完成及 `h2 drove complete` 后，作者、Worktree 与审查员 Worker 会保持 `idle` 热待命状态（对应的 Git Worktree 会完成合并并重置干净），便于通过 `h2 drove add` 秒级复用上下文。仅当编排者会话退出/移入回收站、用户在 Drove Web 中删除/回收该 Run，或显式停止 Worker 时才会关闭回收。
  - `Core` → `DroveRuntime` 的生命周期事件通过无锁 `mpsc::UnboundedSender<PoolSignal>` 传递，从根源避免锁顺序死锁，并保证外部 `h2 kill <a*>` 与编排者关闭/回收钩子与 Drove Worker/Attempt 生命周期完全同步。
- **操作系统级进程沙盒（`sandbox.rs`）**：
  - **Linux（`bwrap`）**：在支持用户命名空间的环境下，Worker 启动时以只读方式挂载 `<state>/drove`，用 `--tmpfs` 遮蔽 `<state>/drove/secrets` 与 `<state>/secrets`，当 `<cwd>` 位于 `<state>/drove/worktrees` 下时重新绑定为可写，对 `readonly` 角色则强制 `--ro-bind <cwd>`。
  - **macOS（`sandbox-exec`）**：当 `/usr/bin/sandbox-exec`（Seatbelt）可用时，通过内联 SBPL 策略禁止写入 `<state>/drove`、`drove.json` 和 `ai.json`（仅对 `<state>/drove/worktrees` 下的工作树重新放行写入），禁止 `readonly` 角色写入 `<cwd>`，并彻底禁止读写 `<state>/drove/secrets` 与 `<state>/secrets`。
  - **Windows（`restricted-token`）**：通过 `herdr2 __drove-sandbox -- <argv>` 调用 Win32 `CreateRestrictedToken`（`DISABLE_MAX_PRIVILEGE` + `NT AUTHORITY\RESTRICTED` `S-1-5-12`）与 `CreateProcessAsUserW` 及 `KILL_ON_JOB_CLOSE` Job Object 托管，同时为 `S-1-5-12` 幂等设置 NTFS Deny ACE，阻止读写 `<state>/drove/secrets` 和 `<state>/secrets`、阻止写入 `<state>/drove`、`drove.json` 和 `ai.json`（对 `<state>/drove/worktrees` 设置受保护 DACL 以保持 Worktree 可写且不修改用户仓库 ACL；`readonly` 角色越界编辑仍由 `roles.rs` Diff 护栏拦截）。

---

## 2. 界面职责拆分：Herdr2 桌面端（设置 → Drove）vs 只读 `drove-web`

- **`herdr-app`（`defaults/frame/settings/main.js` → `Drove` 标签页）**：
  - 统一配置本机与已配对 SSH 远程主机的唯一控制面：
    - **角色配置（Roles）**：配置 `Agent`、`Model`、思考强度（`Thinking Effort`）、多候选备选顺延（`Fallback`）与新增自定义角色（`+ Add role`）。
    - **全局 AI 助手（AI Assistant）**：配置 `enabled`、服务地址（`Service URL`）、掩码 `API Key`、保存与连通性测试（不绑定特定厂商预设）。
    - **Magpie 额度监控（可选）**：默认关闭，按需配置网关地址与连通性测试。
  - 写入密钥时先落盘到本机临时 JSON 文件，并立即通过 `--file <tmp> --consume` 消费删除，确保 API Key 永不出现在进程命令行 `argv` 中。
- **`drove-web/`（`127.0.0.1:7799` / `H2_DROVE_PORT`）**：
  - 由 `herdr2` 内置的本机 HTTP/1.1 + SSE 服务（`http.rs`、`routes.rs`）直接托管，自动注入 `window.__DROVE_TOKEN__`。
  - 专注全局只读观测与诊断：实时 DAG 编排画布、Worker 流式输出、审查 Diff 补丁、Verify 验收日志及只读角色矩阵画像（`PUT /api/agents` 与 `PUT /api/ai/config` 返回 `405 configured_in_app`）。

---

## 3. 执行调度、质量门禁与多机 SSH 联邦

- **DAG 调度器与路由器（`scheduler.rs`、`router.rs`、`protocol.rs`）**：
  - 支持静态 `foreach`、基于 JSON 产物的动态 `foreachFrom` 展开、`when` 条件表达式、`triggerRule`（`all_success` / `any_success`）、原生 `kind: exec` Shell 步骤、同角色热 Worker 复用以及静默停滞（Stall）看门狗。
  - 编排者唤醒（`notify.rs`）在 `t*` 空闲时通过 `Core::pty_send`、或向 `a*` 通过 `Core::send` 投递精炼状态摘要。
- **四重质量门禁（`roles.rs`、`verify.rs`、`integrate.rs`、`review.rs`、`ai.rs`）**：
  - **角色写范围护栏（Role Scope）**：对比 Attempt 基线与实际改动路径，拦截 `readonly` 写入与超出 `scoped_write` 模式的文件修改（返回 `422 role_scope_violation`）。
  - **验证门禁（Verify Gates）**：执行单任务 `spec.verify` 与 Run 级 `verify`（支持 `goal.autoRepair` 自动自愈），留存完整日志产物并检测连续停滞输出哈希。
  - **Worktree 隔离与合并**：自动创建隔离的 detached Git / AOSP `./bin/harness` Worktree，并通过按 Run 粒度的异步互斥锁串行安全合并回主分支。
  - **异构对抗审查（Adversarial Review）**：生成不可变候选补丁（首轮为完整 Diff，后续轮次为增量 Delta Diff），交由只读 `reviewer` ACP 轮次独立审查，直至通过或触发最大轮次熔断。
- **多机 SSH 联邦（`http.rs`、`remote.rs`、`mod.rs`）**：
  - 本地 `h2`（`:7799`）自动聚合已连接 SSH 远程主机上的 `<machine>/<run_id>`，通过 `drove.http_proxy` 转发 `<machine>/*` 与 `?on=<machine>` 接口请求，通过分帧 `drove.subscribe` 中继实时 SSE 事件，并处理 `$/drove_open_web` 通知，让你在 SSH 会话里执行 `h2 drove web` 也能直接唤起本机浏览器。
