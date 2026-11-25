---
title: "智能体模板（Templates）"
description: "复用 ACP 预设、模型、权限策略与开场指令，按角色名称一键启动智能体。"
---
将常用的 ACP 预设、自定义命令、模型、权限策略与开场角色指令保存为模板文件，后续只需按模板名称即可一键派生对应角色智能体。

[返回仓库首页](https://github.com/herdr2/herdr2) · [查看命令参考](/reference/commands/#h2-templates)

## 创建一个代码审查模板

在 Linux / macOS 上将以下内容保存至 `~/.config/herdr2/templates/reviewer.md`（Windows 上为 `%APPDATA%\herdr2\templates\reviewer.md`，或位于 `$XDG_CONFIG_HOME/herdr2/templates`）：

```markdown
---
description: 只读代码审查专家，请传入目标文件路径与审查范围。
agent: claude
model: sonnet
permissions: approve-reads
---
你是一名专注的代码审查智能体。提出结论前请先完整阅读源码。
不要修改任何文件，也不要启动其他子智能体。
发现缺陷时请给出文件路径、行号和简明原因。
如果该审查由父智能体派发，请通过 `h2_send` 或 `h2 send` 汇报结果。
```

按名称启动并与之交互：

```sh
h2 templates
h2 run --bg --name review --cwd /path/to/repo reviewer "仅审查 src/x.rs。"
h2 wait review
h2 read review --last
h2 send review "请复核错误处理分支。"
```

如未附加 `--bg`，`h2 run` 会等待首个 ACP 轮次结束并直接输出完整对话记录。

## 模板文件格式

每个模板对应一个以 `.md` 结尾的 Markdown 文件（去掉 `.md` 后的文件名即为模板名；每次使用时实时读取，无需重启守护进程）。

使用 `---` 包裹顶部的 frontmatter，内部采用简洁的单行 `key: value` 键值对（不使用 YAML 引号或多行值）：

| 字段 | 说明 |
| --- | --- |
| `agent` | 内置 ACP 预设（`claude`、`codex`、`gemini`、`opencode`、`copilot`、`cursor`、`kimi`、`qwen`、`pi` 等）或自定义命令字符串（未设置 `command` 时必填）。 |
| `command` | 省略 `agent` 时使用的替代 ACP 启动命令行。 |
| `description` | 执行 `h2 templates` 时展示的简短说明。 |
| `model` | 可选，创建会话后通过 ACP `session/set_config_option`（`model`）设置的模型。 |
| `mode` | 可选，通过 ACP `session/set_mode` 设置的会话模式。 |
| `permissions` | 覆盖默认权限策略（`approve-all`、`approve-reads`、`deny-all`、`ask`）。 |
| `inject_mcp` | `true` 或 `false`（覆盖全局 `inject_mcp` 配置，显式传入 `--no-mcp` 除外）。 |
| `system_prompt` | 创建 ACP 会话时通过 `_meta.systemPrompt` 注入的系统提示词。 |

Markdown 正文会置于你的任务 Prompt 之前（以空行分隔），并在 `session/new` 完成后自动入队到该智能体的 ACP 收件箱（Inbox）。

使用 `--on <machine>` 在远程主机启动时，由远端主机解析对应模板并在远端创建 ACP 会话。
