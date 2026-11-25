---
title: "安全与信任模型（Security）"
description: "Herdr2 Core 的运行权限边界、访问控制与安全建议。"
---
Herdr2 Core（`h2`）以当前操作系统账户的权限运行 ACP 智能体与后台命令。

[返回仓库首页](https://github.com/herdr2/herdr2) · [OpenRPC 协议定义](https://github.com/herdr2/herdr2/tree/main/herdr-core/schema)

## 运行机制与权限边界

CLI 在需要时会自动拉起后台 Core 守护进程。
Core 通过纯标准输入/输出管道（stdio pipes）直接派生无头 ACP 适配器（不分配 PTY、Shell 或 holder 进程），并继承当前运行账户的文件系统与网络访问权限。模板与预设同样以你的账户权限启动对应的智能体进程。

除非你明确希望所有客户端拥有同等高权限，否则**请勿以 `root` 或管理员身份运行 Core**。
ACP 权限策略（默认为 `approve-reads`）会将适配器发起的写入/执行权限请求挂起至 `blocked` 状态等待确认；操作系统/容器隔离层（以及 Drove 的进程沙盒）构成底层的安全边界。

## 谁可以连接到守护进程

在 Unix（Linux / macOS）平台上，Core 监听本地 Unix Domain Socket，**不会**对外暴露公网 TCP 端口：
- 状态目录与 Socket 目录均以 `0700` 权限创建；
- Core 不会主动修改已存在目录的权限，自定义 Socket 路径时请确保目录仅限本人账户访问；
- 本机 Socket 连接不设额外 API 密码或按客户端区分的鉴权。

在 Windows 平台上，Core 使用命名管道（Named Pipes），其 ACL 仅允许当前用户账户与 `SYSTEM` 访问。

## 多会话隔离与原版共存

默认会话名为 `default`。设置环境变量 `H2_SESSION` 即可启动完全隔离的 Core 实例、智能体注册表、对话转录记录与通信端点：

```sh
H2_SESSION=scratch h2 ls
```

`herdr2`（`h2`）与原版 `herdr-core`（`hc`）采用完全独立的二进制名称、环境变量前缀（`H2_*`）、运行时 Socket 与配置/状态目录，可实现零冲突同机共存。
同一配置目录下的配置文件与模板在多个 `herdr2` 会话间共享；自动化测试应使用独立的 `H2_SESSION` 与临时 XDG 目录，避免污染日常工作状态。

## 远程主机信任模型

SSH 负责远程登录认证、主机指纹校验与链路加密，Core 直接复用该加密通道承载协议通信。
如使用自定义 `--via` 传输命令，其传输安全与信任边界由该命令自行保证。
将远程主机添加到本机后，本机客户端即可操控该远端 `herdr2` Core 上的智能体、命令与文件；移除主机记录仅断开本机连接，不会停止远端运行中的智能体。详见 [远程主机联邦（Machines）](/reference/machines/)。

## 状态目录与通信端点

| 项目 | 默认路径 |
| --- | --- |
| Unix 状态目录 | `~/.local/state/herdr2/<session>/` |
| Unix 配置文件 | `~/.config/herdr2/config.toml` |
| Windows 状态目录 | `%LOCALAPPDATA%\herdr2\<session>\` |
| Windows 配置文件 | `%APPDATA%\herdr2\config.toml` |
| 模板目录 | 与 `config.toml` 同级的 `templates/` |

在各平台上均可通过 `XDG_STATE_HOME` 与 `XDG_CONFIG_HOME` 覆盖默认目录。
在 Unix 平台上，Socket 默认位于 `$XDG_RUNTIME_DIR/herdr2/<session>.sock`，其次回退至 `/run/user/<uid>/herdr2/`，最后回退至会话状态目录。设置 `H2_SOCKET` 可覆盖客户端连接端点（否则读取 `config.toml` 中的 `socket`）。

状态目录内包含 `agents.json`、各智能体的 JSONL 对话转录（`transcripts/<address>.jsonl`）、`machines.json`、`peers.json`、`docs.json` 与 `core.log`。由于转录记录可能包含敏感上下文，请务必将状态目录视为私密数据妥善保护。

## 更新与完整性校验

```sh
h2 update
h2 update --version 0.2.0
```

官方安装脚本与在线更新流程均会依据发布清单校验压缩包的 SHA-256 摘要（可通过 `HERDR2_RELEASES_URL` 覆盖默认发布地址）。
在 macOS 用户级安装中，`Herdr2.app` 位于 `~/.local/share/herdr2/active/Herdr2.app`（应用标识 `dev.herdr2.core`），并在 `~/.local/bin` 创建软链。
如需安装可信的本地编译产物，可使用 `h2 update --from /path/to/herdr2`。
