---
title: "安装与升级（herdr2-install Skill）"
description: "通过 herdr2-install Agent Skill 让你的 AI 编程助手自动完成 Herdr2 桌面端、h2 守护进程与配套 Skills 的安装和升级。"
---

:::tip[唯一推荐安装方式：`herdr2-install` Skill]
Herdr2 统一通过 **`herdr2-install`** Agent Skill 完成跨平台安装与升级（支持 macOS、Linux、Windows 与 WSL），无需手动挑选安装包或配置环境变量。
:::

## 一步完成安装

将下面这句话直接发送给你的 AI 编程助手（**Antigravity、Claude Code、Codex、Cursor、OpenCode、Windsurf** 等均可）：

```text
请读取 https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md 并按 herdr2-install skill 步骤帮我安装 Herdr2（桌面端 + h2 核心 + 配套 Skills）。
```

> 若当前网络访问 GitHub Raw 较慢，可直接将本站同步镜像地址提供给 AI 助手：[`/skills/herdr2-install/SKILL.md`](/skills/herdr2-install/SKILL.md)。

---

## `herdr2-install` Skill 会自动为你完成什么？

1. **自动识别平台与架构**：检测本机属于 macOS（Apple Silicon）、Linux、Windows 还是 WSL 环境。
2. **下载并安装最新版 Herdr2**：自动拉取对应平台的桌面端应用与 `h2` 核心守护进程，并处理好 `PATH`。
3. **启动并自检守护进程**：校验 `h2 --version` 与 `herdr2 --version`，自动拉起常驻 `h2 server`。
4. **注入全部配套 Skills**：执行 `h2 skill install --all`，将 `herdr2`、`drove`、`drove-add`、`drove-setup` 自动安装到本机已有的 Coding Agents 中。
5. **引导首次配置内置 Core AI**：启动 Herdr2 桌面端，在欢迎向导中接入全局轻量 Core AI（推荐 DeepSeek / OpenAI 兼容接口）即可开始使用；后续版本升级直接点击界面右上角 **更新** 按钮即可热部署。

---

## 安装后如何在 Herdr2 App 中开始多 Agent 协作？

你不需要在终端里手敲任何 `h2` 命令行——整个日常协作都在 **Herdr2 桌面端 + 配套 Skills** 中完成：

1. **打开 Herdr2 桌面端并进入项目工作区**：完成欢迎向导（配置全局轻量 Core AI）后，点击左侧「工作区」旁的 `+` 打开你的代码仓库。
2. **打开一个主 Agent**：点击顶部标签栏的 `+`，选择你常用的 Agent（如 Claude Code、Codex、Antigravity、Cursor、Gemini 等）。
3. **直接用配套 Skills 指挥多 Agent 牧群**：
   - **`/drove-setup`**：在「设置 → Drove」或对话中完成多角色（`coder` / `tester` / `reviewer` / `writer` / `researcher`）的模型与思考强度配置。
   - **`/drove <你的研发需求>`**：主 Agent 自动化身编排者，拆解任务 DAG 并派生多角色无头子 Agent 在隔离 Worktree 中并行开发、跑测验收与异构审查；你可以随时在左侧「智能体」树或 Drove Web 画布中查看实时进展与审批关键写入。
   - **`/drove-add <追加需求>`**：需求有新变化时动态追加任务，直接复用温热（`idle`）的已有子 Agent 上下文。

---

## 查看原始 Skill 文件

- GitHub 源文件：[`skills/herdr2-install/SKILL.md`](https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md)
- 本站静态镜像：[`/skills/herdr2-install/SKILL.md`](/skills/herdr2-install/SKILL.md)
- 下一步：阅读 **[01. 安装、快速上手与界面导览](/guide/01-getting-started/)**
