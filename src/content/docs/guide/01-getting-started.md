---
title: "01. 安装、快速上手与界面导览"
description: "完成多平台安装与环境校验、理解双平面架构与必配 Core AI 欢迎向导，5 分钟跑通原生 CLI + 润色输入与 ACP 开发闭环。"
---
> 本篇带你完成 Herdr2 安装与环境校验、理解核心双平面架构、熟悉主界面五大区域，并用 5 分钟实战演示如何在 Herdr2 中**打开原生 CLI Agent（以 Claude Code 为例）完成日常开发**，同时配合**无头 ACP 智能体**、实时 Git Diff 与后台持久托管跑通完整闭环。

---

## 1. 安装 Herdr2

Herdr2 包含两部分：**后台守护进程与 CLI（`h2`）** 和 **原生桌面应用（`herdr2`）**。官方安装包同时内置两者，提供 **AI 一键安装** 与 **各平台手动安装** 两种方式。

### 1.1 推荐：交给你的 AI 助手一键安装

如果你本机已经在用 AI 编程助手（Antigravity、Claude Code、Codex、Cursor、OpenCode 等），最省事的方式是把仓库内置的 [`herdr2-install` Skill](/guide/install/) 直接交给它执行——把下面这句话发给你的 AI Agent：

```text
请阅读 https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md 并按步骤在本机安装和配置 Herdr2。
```

它会自动识别你的操作系统与 CPU 架构，从 [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) 拉取对应安装包、校验 `PATH` 与 `h2` 守护进程，并完成配套 Agent Skills 的注入。

### 1.2 按平台手动安装

#### macOS（Apple Silicon）

- **一键脚本（推荐）**：自动安装 `~/Applications/Herdr2.app` 并在 `~/.local/bin` 创建 `herdr2` 与 `h2` 软链：
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
  ```
- **手动安装包**：前往 [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) 下载 `Herdr2-<版本>-macos-aarch64.dmg`，拖入 `Applications`，并按需将 `Herdr2.app/Contents/MacOS/Herdr2` 与 `Herdr2.app/Contents/Helpers/h2` 软链至 `~/.local/bin`。

#### Linux / WSL

- **Debian / Ubuntu（`.deb` 单包，含桌面端、`h2` 与桌面菜单入口）**：
  从 [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) 下载 `herdr2_<版本>_amd64.deb` 后执行：
  ```bash
  sudo apt-get install -y ./herdr2_<版本>_amd64.deb
  ```
- **通用发行版 / 无 `sudo` 权限**：
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
  ```
- **纯命令行服务器或 WSL 内部（仅安装 `h2` 守护进程与 CLI，不含 GUI）**：
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/core-install.sh | sh
  ```

:::tip
**WSL 用户推荐用法**：在 Windows 宿主上安装 Herdr2 桌面端，在 WSL 内用上面的 `core-install.sh` 安装 Linux 版 `h2` 核心，即可直接在 Windows 桌面窗口里统一管理 WSL 与远程 Linux 工作区。
:::

#### Windows（x64）

- **图形安装程序（推荐，无需管理员权限）**：从 [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) 下载 `Herdr2-Setup-<版本>-windows-x86_64.exe` 双击安装（自动将桌面端装至 `%LOCALAPPDATA%\Programs\herdr2`，`h2` 装至 `%LOCALAPPDATA%\Programs\h2` 并配置用户 `PATH`）。
- **PowerShell 一键安装**：
  ```powershell
  irm https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.ps1 | iex
  ```

### 1.3 验证安装与注入配套 Skills

安装完成后，确保 `~/.local/bin`（macOS / Linux）或 `%LOCALAPPDATA%\Programs\h2` 与 `%LOCALAPPDATA%\Programs\herdr2`（Windows）已在 `PATH` 中，在新终端里执行：

```bash
# 1. 验证二进制版本
h2 --version
herdr2 --version

# 2. 启动并检查 h2 后台守护进程
h2 server start
h2 server status
```

**推荐顺手注入配套 Skills**：执行以下命令，将 `herdr2`、`drove`、`drove-add`、`drove-setup` 自动安装到本机已检测到的编码助手（Antigravity、Claude Code、Codex、Cursor、OpenCode、Windsurf 等），让它们原生懂得用 `h2` 协作编排：

```bash
h2 skill install --all
h2 skill status
```

:::note
**后续升级无需重装**：安装完成后即支持应用内 **OTA 一键热更新**——有新版本发布时，桌面窗口右上角会出现 **Update / 更新** 按钮，点击即可热部署更新，且不会中断后台正在运行的终端与 Agent。
:::

---

## 2. 为什么是「双平面」架构？

传统终端复用器（如 tmux）擅长持久托管 Shell，却把 AI 编程工具的对话、代码 diff 和审批卡死在 ANSI 字符流里；主流 IDE 或 AI 桌面工具虽然可视化友好，重启后也能保留历史会话，但运行中的本地终端与 Agent 往往与窗口生命周期绑定——关闭窗口、更新重启或断开远程连接时，正在跑的进程仍会被中断，也难以在脱离桌面窗口后直接通过 CLI（如 SSH 或脚本）继续查看和操控。

Herdr2 将整个系统拆分为两个解耦组件：

![Herdr2 双平面解耦架构](/images/docs/diagram-dual-plane-architecture.svg)

带来的直接好处：
1. **永不掉线**：误关窗口、升级 Herdr2 桌面版、甚至合上笔记本断开 SSH，你的本地或远程终端与 Agent 都在 `h2` 后台继续干活。
2. **一屏管多机**：本机、WSL、Linux 编译服务器与 macOS 可以同时接入同一个桌面窗口，像切换本地文件夹一样切换不同主机上的工作区。
3. **CLI 与 GUI 同源**：桌面上的每一个点击都对应一条标准命令（`herdr2 do <command>`）或底层 `h2` RPC，既能点鼠标也能写脚本。

---

## 3. 首次启动与欢迎向导

确认 `h2 server status` 正常后，从命令行执行 `herdr2`（或从应用程序 / 开始菜单打开 `Herdr2`）即可启动桌面端。首次打开时，Herdr2 会展示**欢迎向导（Welcome）**：

![Herdr2 首次启动欢迎向导](/images/docs/01-welcome.png)

在欢迎向导中，你可以完成两项关键初始化：
1. **外观与语言偏好（第一页，无需重启，立即生效）**：
   - **界面语言**：在 `English` 与 `简体中文` 之间实时切换（后续也可在「设置 → 外观」或通过命令 `app.language` 随时切换）。
   - **外观模式**：选择 `跟随系统`、`浅色` 或 `深色`。
   - **界面缩放**：按 `-` / `+` 调整全局字号与 UI 缩放比例（日常也可用 `Ctrl+=` / `Ctrl+-` / `Ctrl+0` 随时微调）。
2. **配置全局 Core AI 助手（必做）**：填入任意 **OpenAI 兼容接口**（推荐 **DeepSeek 官方 API**：`https://api.deepseek.com/v1` + `deepseek-chat`，也支持企业网关或本机 `Ollama` / `vLLM`）并点击连通性测试通过。

:::note
**请务必完成 Core AI 配置——AI 能力是 Herdr2 的核心！**
Herdr2 不是普通的终端套壳，内置的全局 Core AI 贯穿了整套工作流：
- **✨ 润色输入（`Ctrl+Alt+P`）**：在原生 CLI 终端、ACP 对话框与闪念清单里一键把口语化草稿原地改写为结构化工程 Prompt（支持 `Ctrl+Alt+U` 反悔撤销）；
- **CLI 终端智能状态识别**：精准判断终端里的编码工具何时在思考、何时出错、何时卡在审批提问；
- **日常全链路提效**：右侧「变更」面板 **AI 生成提交说明**、跨 Agent **接力/分叉摘要与智能推荐**、**Catch-up 回归简报**、**快照故障定位**与 **Drove 角色自动配置**。

Core AI 采用轻量调用与按需缓存，单次开销极低；详细配置与功能说明见 [第 04 篇：全局 Core AI 与润色输入](/guide/04-handoff-checkpoints-and-ai/#1-全局-core-ai-助手herdr2-的必配核心中枢)。
:::

:::tip
以后如果想重新打开欢迎向导，只需按 `Ctrl+Shift+P` 打开命令面板，输入「欢迎」或运行 `herdr2 do app.welcome` 即可；随时也可按 `Ctrl+,` 进入「设置 → AI 助手」修改配置。
:::

---

## 4. 主界面五大核心区域

完成向导并打开你的第一个项目目录后，你将看到 Herdr2 默认布局（`main`）的完整工作台：

![Herdr2 主工作台五大核心区域标注](/images/docs/02-workspace-overview-annotated.png)

对照上图编号，整个窗口由 **5 个清晰的功能区** 组成：

1. **左上「工作区（Spaces）」列表**：
   - 每个工作区代表一个项目目录（例如图中的 `order-service` 和 `docs-lab`），如果是远程 SSH 主机的工作区，会按主机自动分组。
   - 点击右侧 `+` 可新建工作区；拖曳工作区条目可调整排序；点击顶部搜索图标可快速跳转。
2. **左中「智能体（Agents）」实时状态栏**：
   - 汇聚所有活跃的 **ACP 无头智能体（`a*`）** 与 **交互式终端里的编程 CLI**。
   - 自动按紧急程度分组置顶：**待确认（Blocked，红标 `!`） > 已完成（Done） > 运行中（Working） > 空闲（Idle）**。
   - 如果某个主 Agent 派生了子 Agent，会在父节点下方折叠为树状子列表，点击左侧展开箭头即可查看。
   - 顶部提供「速览」红标胶囊（快速跳转待处理会话）、回收站图标（误删会话可恢复）与历史入口。
3. **左下「闪念清单（Flash Notes）」与全局入口**：
   - 随时按 `+` 记下一条灵感或待办，并在合适时机一键派发给任意 Agent 执行。
   - 最底部固定「设置（`Ctrl+,`）」与「添加主机（SSH）」入口。
4. **顶部「标签栏」与右侧面板开关**：
   - 左侧展示当前工作区的所有标签页（如 `dev-shell`、`tests`，以及打开为标签页的 ACP 对话 `a1`、`a2`），支持点击 `+` 从菜单新建 Shell 或直接启动已安装的 AI CLI / ACP 智能体。
   - 右上角固定三个工作区辅助面板开关：**文件**、**变更**、**快照**，随开随关且按工作区记住状态。
5. **中央「主工作区」与底部「状态栏」**：
   - 中央以卡片形式承载单个或多个分栏的真终端 / ACP 对话窗口；卡片头直接显示当前目录与 Git 分支/未提交改动数（如 `main · 2 改动`）。
   - 底部状态栏汇总当前主机、Git 分支、活跃智能体与待确认计数，右侧提示 `Ctrl+Shift+P 命令面板`。

---

## 5. 命令面板：记住这一个快捷键就够了

刚接触 Herdr2 时，不必死记硬背所有快捷键。按下 **`Ctrl+Shift+P`**（macOS 同理或见快捷键设置），即可呼出**命令面板（Command Palette）**：

![Herdr2 命令面板](/images/docs/03-command-palette.png)

命令面板支持**中英文模糊搜索**，列出全部 94 条应用命令及其对应的快捷键徽标：
- 输入 `分栏` 或 `split` → 找到「向右分栏（`Ctrl+Shift+O`）」「向下分栏（`Ctrl+Shift+E`）」。
- 输入 `变更` 或 `changes` → 打开 Git Diff 与提交面板。
- 输入 `接力` 或 `handoff` → 呼出上下文接力 / 会话分叉弹窗。
- 输入 `布局` 或 `layout` → 切换 `Herdr2` / `Terminals` / `Herdr 98` 等界面布局。
- 按 `Esc` 关闭命令面板。

---

## 6. 核心上手实战：用 CLI Agent 与 ACP Agent 跑通第一个开发闭环

使用 Herdr2 最核心的日常姿势，是**在工作区里直接打开你熟悉的 AI 编程 Agent，一边保留 CLI 工具的原汁原味体验，一边叠加 Herdr2 的实时状态监控、代码变更面板与后台持久托管**；同时按需在同一个工作区里混用**无头 ACP 智能体**处理代码审查或并行任务。

下面基于一个真实的示例仓库 `order-service`，带你 5 分钟走完完整闭环（以 **Claude Code** 为例，本机若安装了 `codex`、`gemini`、`opencode` 等同样适用）。

### 6.1 打开工作区，在原生 CLI Agent 中完成开发

1. **打开本地 Git 仓库**：点击左侧「工作区」旁的 **`+`**（或按 `Ctrl+Shift+N`），选择项目目录，Herdr2 会自动建立工作区并打开一个默认 Shell 标签页（`dev-shell`）。
2. **启动 Claude Code CLI**：点击顶部标签栏右侧的 **`+`** 按钮选择 **Claude Code**（或在终端中直接输入 `claude` 回车）。它运行在 Herdr2 内置的 Ghostty 真终端中，**完整保留 Claude Code 原生 TUI 界面、斜杠命令、快捷键与输入体验**。
3. **用「✨ 润色输入」把口语草稿变成清晰指令，再派发开发任务**：
   - 在 Claude Code 输入框里先随手敲一句口语化的想法，比如 `给 pricing 加个 NEW10 打九折顺便补单测跑一下`。
   - **直接按 `Ctrl+Alt+P`**（macOS 为 `Cmd+Alt+P`），或点击顶部卡片工具条的 **「✨ 润色输入」** 按钮：Herdr2 的 Core AI 会结合当前仓库路径与会话上下文，**直接在 CLI 输入框原地**将你的草稿润色成清晰、无歧义的工程指令（如果不满意，立刻按 **`Ctrl+Alt+U`** / macOS `Cmd+Alt+U` 即可一秒恢复原稿；详见 [第 04 篇：AI 润色输入详解](/guide/04-handoff-checkpoints-and-ai/#2-重点功能详解ai-润色输入prompt-polish)）。
   - 按回车发送后，Claude Code 开始改代码并跑通 `python3 -m unittest`；点击右上角的 **「变更」** 按钮展开 Git Diff 面板，即可在一屏内完成「润色发令 → 原生开发 → 审阅 Diff → 提交」闭环：

![在 Herdr2 原生终端中运行 Claude Code CLI 并联动右侧变更面板](/images/docs/01-cli-agent-dev.png)

留意上图中 Herdr2 为原生 CLI Agent 自动叠加的 4 项关键体验：
- **顶部卡片工具条零侵入增强（含原地润色）**：不破坏下方原生终端，卡片头直接提供 **✨ 润色输入**、**旁路**、**分叉**、**接力**、**发送上下文** 以及实时 Git 改动胶囊（`main · 2 改动`）。
- **左侧「智能体」栏自动追踪状态**：终端内运行的 Claude Code（`t3 · CLI`）会自动上报并在完成后标为 **已完成**（执行时显示 **运行中**，等待授权时置顶标红为 **待确认**），切去别的标签页也不会漏掉提醒。
- **右侧「变更」面板同步呈现 Git Diff**：左侧 Claude Code 刚改完 `src/pricing.py`（`+2`）和 `tests/test_pricing.py`（`+9`），右侧立刻高亮展示改动行；确认无误后直接在底部输入提交说明，或点 **「AI 生成」** 一键提交。
- **随时分栏辅助调试**：按 `Ctrl+Shift+O` 还可向右分栏开一个普通终端，一边让 Agent 改代码、一边手动跑构建或看服务日志。

### 6.2 同一个工作区里启用无头 ACP Agent（结构化对话）

除了原生终端 CLI，你还可以在同一个工作区里再开一个 **无头 ACP 智能体**（例如专门负责代码审查、方案调研或并行改另一个模块）：

- **桌面端启动**：点击顶部标签栏的 **`+`**（或按 `Ctrl+Alt+N`），选择已安装的 Agent 预设（如 `Claude`）并以 **ACP 模式** 新建标签页。
- **命令行启动**：也可以在任意终端里通过 `h2 run` 直接派生，它会自动同步出现在桌面左侧的「智能体」列表中：
  ```bash
  h2 run --bg --name claude-review --agent claude --cwd /path/to/order-service \
    --prompt "请读取 src/pricing.py，简要总结当前支持的优惠码规则，并指出 2 个潜在边界问题与改进建议（仅分析，不修改文件）。"
  ```

下图是同一个 `order-service` 工作区中，用 **Claude ACP（`a1`）** 对刚才的 `src/pricing.py` 做完代码审查后的真实界面：

![在同一工作区中运行无头 Claude ACP 智能体并查看结构化对话](/images/docs/01-acp-agent-chat.png)

对比原生 CLI 模式，ACP 模式提供：
- **纯净的结构化对话视图**：无终端控制符干扰，Markdown 列表与代码块清晰排版，每轮回答下方自带 **「从此轮分叉」** 按钮，顶部实时展示上下文占用（如 `上下文 9%`）。
- **底部免重启热切换参数**：直接点击输入框下方的下拉菜单，即可实时切换 **模型**、**思考强度** 与 **权限模式**，并支持拖入图片/文件附件与 **「润色」** 提示词。
- **CLI 与 ACP 统一汇聚监控**：看左侧「智能体」栏，原生终端里的 `t3 (CLI)` 与无头会话 `a1 (ACP)` 同屏汇总，状态、耗时与一键切换完全一致。

:::tip
**CLI 模式 vs ACP 模式怎么选？**
- **优先用 CLI 模式（`t*`）**：日常主力交互开发，想 100% 享受 Claude Code / Codex / Gemini 原生 TUI 界面、斜杠命令和快捷键手感，同时借助 Herdr2 管理多项目、看实时 Diff 与后台保活。
- **优先用 ACP 模式（`a*`）**：需要结构化排版与工具卡片、排队收件箱（Inbox）与中途插话（`--steer`）、行内权限审批，或需要用脚本 / 多 Agent（Drove）自动编排协作（详见 [第 03 篇](/guide/03-headless-acp-agents/)）。
:::

### 6.3 验证「后台托管」与 CLI 接管

现在趁 `t3`（Claude Code CLI）与 `a1`（Claude ACP）都还开着，直接**关闭 Herdr2 桌面窗口再重新打开**——你会发现刚才的工作区、两个 Agent 会话、历史输出和 Git 改动全部完好无损。

即使脱离桌面窗口（例如通过 SSH 连到这台机器），你也可以随时用 `h2` 命令行查看、发消息或接入同一个会话：

```bash
# 查看当前后台托管的全部终端（t*）与无头智能体（a*）
h2 ls

# 读取原生 CLI 终端（t3）屏幕输出，或读取 ACP 智能体（a1）最新回复
h2 read t3
h2 read --last a1

# 直接在命令行接入正在运行的 CLI 终端继续交互（按 Ctrl-\ 再按 d 脱离且不中断进程）
h2 attach t3

# 从命令行继续向后台 ACP 智能体派发下一条指令
h2 send a1 "把你刚才提到的大小写归一化问题直接修一下并跑通单测"
```

---

**下一篇**：[02. 工作区、终端与代码面板 →](/guide/02-workspaces-and-terminals/) ｜ [返回目录](/guide/)
