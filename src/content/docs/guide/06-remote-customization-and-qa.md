---
title: "06. 远程主机、深度定制与自动化自检"
description: "SSH 多机联邦、三套布局与 Mods/Layouts 热重载定制，以及隔离沙盒自动化 QA 框架。"
---
> 本篇面向希望把 Herdr2 融入重度生产环境的进阶用户：讲解如何通过 SSH 把远程服务器/WSL 统一纳入桌面窗口、如何热定制外观/布局/Mod 面板，以及如何用内置的隔离沙盒 QA 框架做零污染自动化自检。

---

## 1. 多台主机，汇集在同一个窗口（SSH 远程主机）

如果你平时在笔记本上写前端、在 Linux 编译服务器跑重型编译、或在 WSL 里跑容器，传统做法要维护一堆容易断线的 SSH 窗口。

Herdr2 支持把任意能通过 SSH 访问的主机直接接入本机桌面窗口：
- 远端同样运行独立的 `h2` 守护进程，**本机休眠、断网或重启窗口后，远端终端与 ACP 智能体依然在服务器后台持续运行**。
- 重连后工作区、分栏、历史滚动和正在跑的 Agent 状态自动同步恢复。

按 `Ctrl+,` 进入 **「设置 → 主机」**（或点击左侧边栏最底部的 `+ 添加主机`）：

![设置 -> 主机远程管理页](/images/docs/14-settings-machines.png)

### 通过 CLI 添加与管理远程主机

```bash
# 添加一台 SSH 远程主机（自动检测并在需要时引导安装远端 h2）
h2 machine add buildbox user@192.168.1.50

# 查看所有已配置主机的在线状态与版本
h2 machine ls

# 直接在远程主机上派生后台命令或 ACP 智能体
h2 run --on buildbox --bg --cwd /data/aosp --agent claude --prompt "分析编译失败日志"

# 查看并操作远端会话（使用 <主机名>/<地址> 统一寻址）
h2 ls --on buildbox
h2 read buildbox/a1
h2 attach buildbox/t1
```

:::tip
在远程主机上创建的标签页与工作区会自动在桌面左侧按主机分组显示；当你在一个远程工作区里按 `Ctrl+V` 粘贴本地截图时，Herdr2 还会自动把图片同步为远端临时文件并把路径贴进终端！
:::

---

## 2. 外观、三套内置布局与深度定制

Herdr2 桌面端采用独特的设计哲学：**整个界面本身就是一组可读、可克隆、支持秒级热重载的本地文件**（位于 `HERDR2_APP_HOME`，默认 `~/.config/herdr2` 或对应平台配置目录）。

### 2.1 开箱即用的外观与布局切换

打开 **「设置 → 外观」**：

![设置 -> 外观与布局配置页](/images/docs/13-settings-look.png)

你可以即时调整：
- **界面语言**：`English` / `简体中文` 实时生效。
- **三套内置布局**（也可用 `Ctrl+Shift+L` 快捷键轮换）：
  1. **`Herdr2`（`main`）**：默认全功能工作台（左侧工作区/智能体/闪念，中间卡片分栏，右侧文件/变更/快照面板）。
  2. **`Terminals`**：极简多终端风格（标签融入顶栏，最大化终端可视面积）。
  3. **`Herdr 98`（`win98`）**：复古桌面彩蛋布局，同时也是展示 Mod 强大表现力的完整范例。
- **右侧面板开关**：自由决定工作区默认启用哪些辅助面板（`文件`、`变更`、`快照`）。
- **外观模式与主题**：跟随系统 / 浅色 / 深色，以及多套内置色彩主题与自定义 `themes/<name>.json`。

### 2.2 克隆布局与编写自定义 Mod（热重载）

Herdr2 内置的布局（`layouts/`）和面板模块（`mods/`）在升级时会自动保持最新；如果你想调整结构或自己写一个专属侧边栏面板（例如「我的 PR 列表」或「服务器 GPU 监控」），**先克隆再编辑**，保存后 1 秒内窗口自动热重载：

```bash
# 克隆默认布局为个人专属布局并立即切换
herdr2 do layout.clone '{"name":"main","as":"my-layout"}'

# 克隆内置文件面板作为自定义 Mod 起点
herdr2 do mod.clone '{"name":"files","as":"my-files"}'

# 静态校验自定义 Mod 的初始描述与原生元素绑定
herdr2 check ~/.config/herdr2/mods/my-files

# 热重载所有 Mod（不关闭窗口，也不中断任何终端）
herdr2 do app.reload_mods
```

:::note
**永远可用的逃生舱快捷键：`Ctrl+Alt+Shift+Esc`**
无论你把个人布局或快捷键改坏到什么程度，按下 `Ctrl+Alt+Shift+Esc` 都会把异常配置文件备份为 `*.reset-<timestamp>` 并立刻恢复默认 `main` 布局，该快捷键不可被任何配置覆盖。
:::

### 2.3 程序化控制桌面窗口（`herdr2 do` / `herdr2 shot`）

Herdr2 桌面端暴露了完整的本地控制 CLI，非常适合脚本自动化、演示录制或 UI 调试：

```bash
# 列出桌面端全部 94 条受支持命令及其参数说明
herdr2 commands

# 查看当前窗口焦点、工作区与标签页状态（JSON）
herdr2 status
herdr2 ls

# 执行任意窗口命令
herdr2 do app.language '{"language":"zh-CN"}'
herdr2 do files.open '{"path":"/path/to/file.py","line":42}'

# 无需录屏权限，直接截取当前窗口物理像素级 PNG 截图（本手册全部桌面截图均由此生成！）
herdr2 shot ./window-preview.png
```

---

## 3. 隔离沙盒与 AI 自动化 QA 自检（开发者/贡献者指南）

如果你正在二次开发 Herdr2、编写自定义 Mod，或者想在提交代码前验证全链路回归，Herdr2 仓库内置了一套**完全隔离的 AI 自动化测试与回归框架**（`qa/` + `scripts/qa/`）。

### 为什么「零污染」？

所有沙盒测试通过 `scripts/qa/sandbox.sh` 运行，会在 `/var/tmp/herdr2-qa-<name>` 下创建完全独立的 `H2_SESSION`、`XDG_CONFIG_HOME`、`XDG_STATE_HOME`、`HERDR2_APP_HOME`、独立 `Xvfb` 虚拟显示器与随机 `H2_DROVE_PORT`，并主动清除宿主环境变量，**绝对不会影响你当前正在使用的日常 Herdr2 窗口与 `h2` 会话**。

### 常用 QA 命令速查

```bash
# 1. 目录漂移与契约同步检查（确保 80 个 Core RPC、94 个 App 命令、25 个 Mod 全覆盖）
python3 scripts/qa/sync_check.py --drift

# 2. 运行桌面端前端 Mod 单元测试（Bun）
cd herdr-app && bun test scripts/*.test.ts

# 3. 一键跑完整分层自动化测试：
#    L0（静态检查与单测）+ L1（Core 无头 ACP/权限/快照/MCP/Drove）
#    + L2（无头 GPUI 桌面端实跑与截图）+ L3（无头 Chrome 探针验证 Drove Web）
python3 scripts/qa/runner.py --tier L0,L1,L2,L3

# 4. 手动操作一个隔离沙盒复现问题并截屏取证，结束后彻底清理
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app-up
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app do app.settings '{"section":"drove"}'
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app shot /tmp/repro.png
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh clean
```

每次 `runner.py` 运行都会在 `qa/reports/<timestamp>/` 下生成结构化 `results.json`、人类可读 `summary.md` 以及 `evidence/*.png` 真实渲染截图，方便你或 AI Agent 快速对比定位视觉与交互回归。

---

## 结语

至此，你已经完整掌握了 Herdr2 从基础终端工作区、无头 ACP 智能体与权限仲裁、上下文接力与 Git 快照回滚，到 Drove 多智能体编排、SSH 多机合一与深度定制的全套能力。

遇到任何不确定的快捷键或命令时，记得随时按下 **`Ctrl+Shift+P`** 搜索命令面板，或在终端中运行 **`h2 --help`** 与 **`herdr2 commands`**。祝开发愉快！

---

**上一篇**：[← 05. Drove 多智能体 DAG 编排](/guide/05-drove-orchestration/) ｜ [返回手册首页](/guide/)
