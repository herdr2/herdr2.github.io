---
title: "02. 工作区、终端与代码面板"
description: "掌握 Space/Tab/Split 布局、Ghostty 真终端持久化托管，以及文件、变更与闪念清单面板。"
---
> 本篇详细介绍如何用「工作区 → 标签页 → 分栏」高效组织多项目并发开发，掌握 Ghostty 真终端与 `h2` 托管机制，并用好内置的「文件」「变更」与「闪念清单」面板。

---

## 1. 三级组织模型：工作区、标签页与分栏

Herdr2 将日常研发上下文划分为清晰的三层结构：

| 层级 | 职责 | 命名规则 | 典型用法 |
| --- | --- | --- | --- |
| **工作区（Space）** | 对应一个项目仓库或服务目录（归属于某台主机） | 未手动命名时自动跟随首个终端所在仓库/目录名；按 `Shift+F2` 重命名后固定 | `order-service`、`docs-lab`、`prod-server/api` |
| **标签页（Tab）** | 工作区内的一个子任务上下文 | 默认按序号 `1, 2, ...`；按 `F2` 重命名 | `dev-shell`、`tests`、`refactor-agent` |
| **分栏（Pane）** | 标签页内的并排/上下视图卡片 | 支持同时混排真终端、ACP 对话与 Mod 面板 | 左边写代码/跑服务，右边跑单测或看日志 |

### 1.1 分栏操作与自由重组

在任意标签页中，按 **`Ctrl+Shift+O`** 向右分栏，或按 **`Ctrl+Shift+E`** 向下分栏；每个分栏自带独立卡片标题栏（显示 Shell/程序名、当前路径与 Git 状态），点击顶部抓手还可以直接拖曳互换位置或合并分栏。

![左右分栏终端实战](/images/docs/04-split-terminals.png)

:::tip
观察上图顶部标签页 `dev-shell`：分栏后标签会自动标出 `合并 2` 徽标，表示该标签内包含 2 个并发窗格；如果某一个窗格需要临时放大全屏查看长日志，按 **`Ctrl+Shift+Z`** 即可一键缩放聚焦，再按一次恢复分栏。
:::

### 1.2 核心快捷键速查

| 操作 | 默认快捷键（Linux/Windows） | 对应命令（`herdr2 do`） |
| --- | --- | --- |
| 新建工作区 / 切换工作区 1–9 | `Ctrl+Shift+N` / `Alt+1..9` | `space.new` / `space.select` |
| 重命名当前工作区 | `Shift+F2` | `space.rename` |
| 新建标签页 / 关闭标签页 | `Ctrl+Shift+T` / `Ctrl+Shift+W` | `tab.new` / `tab.close` |
| 切换标签页 1–9 / 前后切换 | `Ctrl+1..9` / `Alt+[`、`Alt+]` | `tab.select` / `tab.prev`、`tab.next` |
| 重命名当前标签页 | `F2` | `tab.rename` |
| 向右分栏 / 向下分栏 | `Ctrl+Shift+O` / `Ctrl+Shift+E` | `pane.split` |
| 窗格间焦点移动 | `Alt+H/J/K/L` 或 `Alt+方向键` | `pane.go` |
| 与相邻窗格交换位置 | `Alt+Shift+H/J/K/L` | `pane.swap` |
| 缩放/还原当前窗格 | `Ctrl+Shift+Z` | `pane.zoom` |
| 关闭当前窗格 | `Ctrl+Shift+X` | `pane.close` |
| 终端内搜索 / 复制 / 粘贴 | `Ctrl+Shift+F` / `Ctrl+Shift+C` / `Ctrl+Shift+V` | `terminal.search` / `copy` / `paste` |
| AI 润色输入 / 反悔恢复原稿 | `Ctrl+Alt+P` / `Ctrl+Alt+U`（macOS 用 `Cmd`） | `prompt.polish` / `prompt.polish_undo` |
| 折叠/展开左侧边栏 | `Ctrl+Shift+B` | `layout.toggle` (`sidebar`) |
| 命令面板 / 设置 / 快捷键帮助 | `Ctrl+Shift+P` / `Ctrl+,` / `Ctrl+Shift+/` | `app.palette` / `app.settings` / `app.help` |

:::note
所有快捷键都可在「设置 → 快捷键」中可视化修改，或直接编辑 `~/.config/herdr2/keys.json`（即时热生效）。
:::

---

## 2. Ghostty 真终端与 `h2` 后台托管

桌面端里的每个终端窗格本质上都是 `h2` 托管的一个真实 PTY 会话（编号 `t1`, `t2`, ...），由内置的 **`libghostty-vt`** 引擎提供 GPU 加速渲染：
- 完整支持 24-bit TrueColor、现代 Shell 提示符（Starship/Oh My Zsh）、Vim/Neovim、tmux/htop 与剪贴板图片粘贴（`Ctrl+V` 在远程终端上甚至会自动把剪贴板图片传成远端临时文件）。
- 终端输出中出现的活跃终端/智能体地址（如 `a1`、`t2`、`devbox/a3`），按住 **`Ctrl+左键`**（macOS `Cmd+左键`）即可原地**速览（Peek）**该会话。

### 用 `h2` CLI 控制后台终端

除了直接在桌面敲命令，你或你的 AI Agent 还可以通过 `h2` 命令行对任意终端进行编排与自动化交互：

```bash
# 启动一个由 h2 后台托管的交互式命令（非 Agent，如长驻服务或构建脚本）
h2 run --bg --cmd "npm run dev" --cwd /path/to/repo --name dev-server

# 查看所有终端与智能体列表
h2 ls

# 向指定终端发送文本或按键（例如回车 \r 或 Ctrl-C）
h2 send t1 "git status -s\r"

# 读取终端屏幕或滚动历史快照
h2 read t1

# 实时附着（attach）到某个后台终端；按 Ctrl-] 脱离且不终止进程
h2 attach t1

# 结束指定终端及其派生的子智能体
h2 kill t1
```

如果把终端标记为 `keep`（桌面端打开的终端窗格默认已开启 `keep: true`），即使遇到守护进程重启，Herdr2 也会在原目录为你保留相同的地址与工作区结构。

---

## 3. 右侧「文件」面板：目录树与语法高亮预览

点击右上角的 **「文件」** 按钮，右侧会滑出当前工作区的项目文件浏览器：

![右侧文件面板与语法高亮预览](/images/docs/05-files-panel.png)

核心能力：
- **目录树懒加载 + Git 改动标记**：修改过的文件会直接标注 `M` / `A` 等状态，方便一眼定位本次改动范围。
- **语法高亮与行号跳转**：支持主流编程语言的语法高亮；点击终端或对话里的文件路径链接（如 `src/pricing.py:22`），或者执行 `herdr2 do files.open '{"path":"...","line":22}'`，会自动打开文件并高亮定位到目标行（如上图中第 22 行）。
- **快速编辑与批注**：顶部工具条支持切换**编辑模式**、发起**行级批注（Review Comments）**并直接发送给当前活跃的 Agent 修复，或一键复制代码。

---

## 4. 右侧「变更」面板：实时 Git Diff 与一键 AI 提交

点击右上角的 **「变更」** 按钮，即可查看当前 Git 仓库的工作区与暂存区全部改动：

![右侧变更面板与 Git Diff](/images/docs/06-changes-panel.png)

核心能力：
- **文件级汇总与状态胶囊**：顶部展示当前分支与 HEAD Commit（如 `main 8021761`），按「未暂存 / 未跟踪」分组列出所有变更文件与 `+N / -M` 行数统计。
- **直接（Unified）与分栏（Split）双视图 Diff**：右上角可一键切换 `直接` / `分栏` 对比模式，增删行分别以柔和绿/红背景标识。
- **行级评审反馈**：在 Diff 视图中直接批注某几行改动，可通过内置能力将结构化评审意见（文件路径 + 行号 + 意见）直接投喂给正在协作的 Agent。
- **底部提交框 + AI 生成提交说明**：无需切回终端手敲 `git commit -m`，直接输入提交说明，或点击右侧 **「AI 生成」** 按钮让全局 Core AI 根据真实 Diff 自动起草规范的 Commit Message，确认后点击「提交」即可。

---

## 5. 闪念清单（Flash Notes）：随手记录，随时派单

在开发过程中突然想到一个边界 Case、一个待补测试或一条重构点子，但手头正在排查另一个问题？

看看左下角的 **「闪念清单」**：
1. 点击 `+` 输入一条简短想法（支持多条排队，按工作区持久化保存）。
2. 当你或某个 Agent 空闲下来时，直接把闪念条目一键派发给指定 Agent，甚至先点一下「AI 润色」把它扩写成清晰的工程任务指令再发出。

---

**上一篇**：[← 01. 安装、快速上手与界面导览](/guide/01-getting-started/) ｜ **下一篇**：[03. 无头 ACP 智能体与权限控制 →](/guide/03-headless-acp-agents/)
