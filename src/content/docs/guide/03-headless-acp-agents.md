---
title: "03. 无头 ACP 智能体与权限控制"
description: "14 种内置 ACP 预设、结构化对话、串行收件箱与实时插话、四档权限审批与内置 MCP 树。"
---
> 本篇是 Herdr2 的核心亮点：带你掌握无头 ACP 智能体的启动、结构化对话视图、串行收件箱（Inbox）与实时插话（`--steer`）、细粒度权限审批策略，以及内置 MCP 父子智能体协同。

---

## 1. 什么是无头 ACP 智能体？


Herdr2 引入了 **ACP（Agent Client Protocol v1）无头运行时**：
- **纯结构化 NDJSON 通信**：`h2` 通过标准输入/输出直接与 Agent 交换结构化 JSON-RPC 消息（文本块、工具调用卡片、图片/文件附件、配置选项、权限请求），**不分配 PTY，不注入任何 `TERM*` 环境变量**，彻底杜绝终端控制符污染。
- **独立编号与生命周期**：每个无头智能体获得独立地址 `a1`, `a2`, ...，拥有精准的状态机（`starting` → `working` / `blocked` / `idle` / `done` / `exited`）。
- **14 种内置 Agent 预设开箱即用**：

| 预设名 | 对应工具 / 生态 | 预设名 | 对应工具 / 生态 |
| --- | --- | --- | --- |
| `claude` | Claude Code | `codex` | OpenAI Codex |
| `agy` | Antigravity | `gemini` | Gemini CLI |
| `cursor` | Cursor Agent | `opencode` | OpenCode |
| `copilot` | GitHub Copilot CLI | `kimi` | Kimi CLI |
| `qwen` | Qwen Code | `pi` | Pi Agent |
| `hermes` | Hermes | `dsh` | DSH |
| `glm` | GLM | `zcode` | ZCode |

---

## 2. 两种启动方式：桌面端与 CLI

### 方式 A：在桌面端一键新建
1. 点击顶部标签栏右侧的 **`+`** 按钮（或按 `Ctrl+Alt+N`），从下拉菜单中选择任意已安装的 Agent 预设，选择以 **ACP 对话** 模式启动。
2. 也可以在启动时直接指定初始模型与思考强度（Reasoning Effort）。

### 方式 B：用 `h2 run` 从命令行或脚本派生

```bash
# 前台运行一个一次性任务，执行完打印最终回复
h2 run --agent claude --cwd /path/to/repo --prompt "分析 src/pricing.py 中的折扣边界条件"

# 后台常驻启动（推荐用于多任务并发），立即可返回地址如 a1
h2 run --bg --name coder-pricing --agent codex --cwd /path/to/repo \
  --permissions approve-reads \
  --prompt "补充 MAX_DISCOUNT_CENTS 单元测试并跑通 pytest"

# 查看智能体详细状态、最新回复或完整事件流
h2 get a1
h2 read --last a1
h2 wait a1
```

:::tip
在命令行里通过 `h2 run --bg` 启动的智能体会**自动出现在桌面端左下角「智能体」列表**中；你可以随时点击它「速览（Peek）」，或点击「保留为标签页（`terminal.keep`）」把它提升到主工作区标签栏中全屏对话。
:::

---

## 3. 结构化 ACP 对话视图详解

当你在主工作区打开一个 ACP 智能体标签页时，界面呈现为清爽的结构化对话视图：

![无头 ACP 结构化对话视图与智能体列表](/images/docs/08-acp-chat-and-agents.png)

这张图集中展示了 ACP 视图的 4 处高频交互：

1. **顶部会话工具条**：
   - 左侧显示 `ACP` 徽标、智能体地址（如 `a1`）与工作目录，下方一行实时显示当前摘要与 Git 分支变更数。
   - 右侧提供四大上下文协作动作：**旁路**（侧边追问不污染主对话）、**分叉**（从当前进度克隆独立会话）、**接力**（跨 Agent/跨模型交棒）、**发送上下文**，以及计时器、回收站和关闭按钮。
2. **结构化消息与工具调用流**：
   - 用户提示词与 Agent 回复以气泡清晰区分，工具执行（如上图的 `>_ git status -s`）自动渲染为可折叠卡片，文件路径（如 `src/pricing.py`）可直接点击在右侧「文件」面板中打开。
   - 每轮对话下方自带复制与 **「从此轮分叉」** 快捷按钮，随时回到任意一轮开启新分支探索！
3. **底部富输入区与热切换参数栏**：
   - 无需重启会话，直接在输入框左下角实时切换：**模型（如 `GPT Test 1`）**、**思考强度（低 / 中 / 高 / 极高）**、**Fast 极速模式** 与 **权限策略（Auto review / Plan / Bypass permissions）**。
   - 右下角支持**粘贴/添加图片与文件附件**，以及点击 **「润色」**（`prompt.polish`）调用 Core AI 把口语化需求润色为清晰精准的工程指令（不满意还可一键撤销）。
4. **左下角「智能体」监控面板**：
   - 实时同步所有会话的状态、耗时和阻塞告警，即使你切去了别的标签页，也不会错过任何一个需要你拍板的智能体。

### 用 CLI 运行时热切换配置

同样的参数切换也可以通过 `h2 config` 脚本化完成：

```bash
# 查看该智能体支持的全部可调配置项（模型、思考深度、模式等）
h2 config a1 --list

# 实时切换模型与思考强度
h2 config a1 --id model --value claude-sonnet-4-5
h2 config a1 --id reasoning_effort --value high
h2 config a1 --id fast-mode --bool true
```

---

## 4. 串行收件箱（Inbox）与实时插话（`--steer`）

当一个 ACP 智能体正在执行耗时任务（状态为 `working`）时，你不必干等它跑完再发下一条消息：

- **默认排队（串行 Inbox）**：直接发送新消息（桌面输入框发送，或运行 `h2 send a1 "顺便检查 README"`），消息会自动进入该智能体的**串行收件箱**；当前轮次结束后，`h2` 会自动按序投递下一条，确保不会发生并发状态错乱。
- **紧急插话（`--steer` 抢占）**：如果发现 Agent 走偏了，需要立刻打断当前轮次并改方向，只需执行：

```bash
# 查看排队中的收件箱消息
h2 inbox ls a1

# 立即取消当前正在执行的轮次，并抢占投递新指令
h2 send --steer a1 "先停一下，不要改 pricing.py 的函数签名，保持向后兼容！"
```

---

## 5. 细粒度权限仲裁与行内审批

在让 AI 自主改代码或跑命令时，安全边界至关重要。Herdr2 为每个 ACP 智能体提供 4 档可配的权限仲裁策略（启动时通过 `--permissions` 指定）：

| 策略值 | 行为说明 | 适用场景 |
| --- | --- | --- |
| `approve-all` | 自动放行所有读/写/执行请求 | 隔离 Worktree、可信沙盒任务 |
| `approve-reads` | 自动放行只读操作；**写入文件或执行命令时自动阻塞并等待人工审批** | 日常本地开发（推荐默认） |
| `ask` | 所有工具调用均阻塞等待审批 | 高敏感目录或首次试用新工具 |
| `deny-all` | 自动拒绝所有需要权限的工具调用 | 纯问答、只读分析与安全审计 |

当智能体触发需要人工审批的操作（例如在 `approve-reads` 模式下请求编辑 `output.txt`）时，它会立即进入 **`blocked`（待确认）** 状态：
- 桌面端左下角智能体列表和顶部标签栏立即亮起红色 **`待确认`** 告警。
- 点开对话即可看到醒目的红框**行内审批卡片**：

![ACP 权限阻塞与行内审批卡片](/images/docs/10-acp-permission-blocked.png)

你可以根据信任级别一键点击：
- **`Allow once`**：仅放行这一次操作。
- **`Allow always`**：本会话内同类操作自动放行。
- **`Reject once` / `拒绝`**：拒绝该工具调用，Agent 会收到拒绝原因并尝试其他方案。
- **`dangerously-skip-permissions`**：当前会话切换为全放行模式。

同样地，你也可以通过命令行远程审批（甚至在手机 SSH 或父 Agent 脚本里批处理）：

```bash
# 查看待审批的权限请求详情
h2 get a2

# 放行或拒绝
h2 approve a2
h2 deny a2
```

---

## 6. 内置 MCP 与父子智能体树

Herdr2 内置了标准 MCP 服务器 **`h2 mcp`**。当 `inject_mcp = true`（默认开启）时，任何由 `h2` 启动的智能体都会自动获得一套开箱即用的工具，用来**派生并管理自己的子智能体**：

| MCP 工具 | 用途 |
| --- | --- |
| `h2_run` | 启动一个子 ACP 智能体或后台命令，自动记录当前会话为 `parent` |
| `h2_send` | 给子智能体发消息（支持排队或 `steer` 抢占） |
| `h2_wait` | 阻塞等待子智能体完成当前轮次或进入 `blocked` 状态 |
| `h2_read` | 读取子智能体的最新回复或终端输出 |
| `h2_ls` | 列出当前作用域下的活跃终端与子智能体 |
| `h2_approve` / `h2_deny` | 替子智能体放行或拒绝工具权限请求 |
| `h2_handoff` | 将上下文接力或分叉到新的子智能体 |

:::tip
**为什么在左侧边栏暂时没看到新派生的子智能体？**
Herdr2 会自动识别 `parent` 血缘关系，把子智能体折叠归类在父节点下方（显示子代计数），**点击父节点左侧的展开箭头**即可展开完整的父子智能体树；点击任意子智能体即可速览其结构化对话。
:::

---

**上一篇**：[← 02. 工作区、终端与代码面板](/guide/02-workspaces-and-terminals/) ｜ **下一篇**：[04. 全局 Core AI、润色输入、接力与快照 →](/guide/04-handoff-checkpoints-and-ai/)
