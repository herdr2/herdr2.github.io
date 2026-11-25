---
title: "远程主机联邦（Machines）"
description: "通过 SSH 将远程 Linux / macOS / WSL 主机纳入本地 h2 会话统一调度与托管。"
---
从本机 `h2` 会话中，直接将远程 Linux / macOS / WSL 主机纳入统一调度，跨机运行无头 ACP 智能体、执行命令与编辑文件。

在启用了 `systemd` 的 Linux 远程主机上，`h2` 会尝试自动开启用户级驻留（lingering），以确保 SSH 注销后远端智能体仍持续运行。若系统拒绝开启且存在有限停止超时，`h2 machine add` 会发出告警，`h2 machine ls` 也会标注 `! stops at logout`。

协议 API 会在 `hello`、`server.status` 及主机查询结果中返回 `keeps_running_after_logout` 与 `logout_linger_user` 字段。

[返回仓库首页](https://github.com/herdr2/herdr2) · [查看命令参考](/reference/commands/#h2-machine)

## 通过 SSH 添加远程主机

```sh
h2 machine add user@host --name box
h2 machine ls
h2 run --bg --on box --cwd /srv/app --agent claude --prompt "检查测试状态"
```

支持的目标地址写法：

| 输入格式 | SSH 连接目标 |
| --- | --- |
| `vps` | 使用 `~/.ssh/config` 中配置的 `Host vps` |
| `user@10.0.0.7` | 以 `user` 连接 `10.0.0.7` 默认 22 端口 |
| `user@10.0.0.7:2222` | 以 `user` 连接 `10.0.0.7` 的 2222 端口 |
| `ssh://user@10.0.0.7:2222` | 同上，采用标准 SSH URL 格式 |

如未指定 `--name`，系统默认提取主机名首段（IP 地址保持完整）并截断至 32 个字符；若名称与智能体 ID（如 `a14`）格式冲突，会自动追加 `-2` 后缀。

远程主机需要安装 `herdr2`（带上 `h2 machine add --install` 可在缺失或版本落后时自动推送安装）。如需连接远端指定命名的独立会话：

```sh
h2 machine add user@host --name sandbox --session scratch
```

## 自定义传输通道（`--via`）

可通过 `--via` 指定任意自定义传输命令，`h2` 会将调用 `herdr2 connect` 的 Shell 命令作为最后一个参数传入：

```sh
h2 machine add --name box --via 'ssh -i /home/me/.ssh/key -o ProxyJump=bastion user@host'
h2 machine add --name sandbox --temp --via 'fly ssh console -a my-app --pty=false -C'
```

在 Windows 上，`--via` 会直接按参数拆分执行而不经过外层 Shell（例如 `h2 machine add --via 'wsl.exe -d Ubuntu -e sh -c' --name wsl`）。
如需接入 Vercel Sandbox，可参考仓库中的 [`via/vercel-sandbox.py`](https://github.com/herdr2/herdr2/blob/main/herdr-core/docs/via/vercel-sandbox.py)，并运行 `h2 machine add --name my-box --temp --install --via '/path/to/vercel-sandbox.py my-box'`。

## 远程运行与跨机操作

本机守护进程会自动将远端智能体镜像到 `h2 ls` 与 `h2 events` 中，使用 `<machine>/<agent>` 地址即可无缝操控：

```sh
h2 run --bg --on box --cwd /srv/app --name rev --agent claude --prompt "审查仓库代码"
h2 ls
h2 read box/rev --last
h2 approve box/rev
```

在远端执行普通命令或直接读写/精确编辑文件：

```sh
h2 exec --on box --cwd /srv/app git diff
printf 'hello\n' | h2 exec -i --on box cat
h2 file read --on box /srv/app/src/main.rs --offset 1 --limit 100
h2 file edit --on box /srv/app/config.txt --old 'port=3000' --new 'port=4000'
h2 file write --on box /srv/app/note.txt < note.txt
h2 put box/rev ./report.txt
```

## 常见排查

- 运行 `h2 machine ls` 查看每台主机的连接状态（`connected`、`needs_login`、`needs_update`、`unreachable`）。
- 若 SSH 凭据或堡垒机会话过期，运行 `h2 machine login box` 重新认证。
- 远端 `h2` 版本过旧时，运行 `h2 machine update box` 直接将本机 `h2` 二进制同步至远端。
- 运行 `h2 machine rm box` 仅移除本机主机记录，不会中断远端正在运行的智能体。
