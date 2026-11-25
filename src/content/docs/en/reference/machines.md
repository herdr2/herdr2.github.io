---
title: "Remote Machines Federation"
description: "Run ACP agents, commands, and file edits across remote Linux/macOS/WSL machines over SSH."
---
Run ACP agents, commands, and file edits on another machine from your local `h2` session.
On Linux with systemd, `h2` tries to enable lingering so remote agents survive logout. If denied with a finite stop delay, `h2 machine add` warns and `h2 machine ls` marks `! stops at logout`.

The API reports `keeps_running_after_logout` and `logout_linger_user` in `hello`, `server.status`, and machine results.

[Back to the README](https://github.com/herdr2/herdr2) · [Command reference](/en/reference/commands/#h2-machine)

## Add a machine over SSH

```sh
h2 machine add user@host --name box
h2 machine ls
h2 run --bg --on box --cwd /srv/app --agent claude --prompt "Check tests"
```

Supported targets:

| You write | ssh connects to |
| --- | --- |
| `vps` | Host `vps` from `~/.ssh/config` |
| `user@10.0.0.7` | `10.0.0.7` as `user`, port 22 |
| `user@10.0.0.7:2222` | `10.0.0.7` as `user`, port 2222 |
| `ssh://user@10.0.0.7:2222` | Same, as an ssh URL |

Without `--name`, the first host label becomes the name (IPs stay whole), shortened to 32 characters; names matching an agent id (`a14`) get a `-2` suffix.

The remote machine needs `herdr2` installed (`h2 machine add --install` copies it automatically when missing or outdated).
To reach a named remote session:

```sh
h2 machine add user@host --name sandbox --session scratch
```

## Use another way in (`--via`)

A custom transport command receives a shell line invoking `herdr2 connect` as its last argument:

```sh
h2 machine add --name box --via 'ssh -i /home/me/.ssh/key -o ProxyJump=bastion user@host'
h2 machine add --name sandbox --temp --via 'fly ssh console -a my-app --pty=false -C'
```

On Windows, `--via` splits arguments without a shell (`h2 machine add --via 'wsl.exe -d Ubuntu -e sh -c' --name wsl`).
For Vercel Sandbox, see [`via/vercel-sandbox.py`](via/vercel-sandbox.py) with `h2 machine add --name my-box --temp --install --via '/path/to/vercel-sandbox.py my-box'`.

## What runs where

Your local core mirrors remote agents into `h2 ls` and `h2 events`:

```sh
h2 run --bg --on box --cwd /srv/app --name rev --agent claude --prompt "Review repo"
h2 ls
h2 read box/rev --last
h2 approve box/rev
```

Non-agent commands and remote file operations:

```sh
h2 exec --on box --cwd /srv/app git diff
printf 'hello\n' | h2 exec -i --on box cat
h2 file read --on box /srv/app/src/main.rs --offset 1 --limit 100
h2 file edit --on box /srv/app/config.txt --old 'port=3000' --new 'port=4000'
h2 file write --on box /srv/app/note.txt < note.txt
h2 put box/rev ./report.txt
```

## Troubleshooting

- Run `h2 machine ls` to inspect line states (`connected`, `needs_login`, `needs_update`, `unreachable`).
- After SSH credentials expire, run `h2 machine login box`.
- Copy your local `h2` binary to an outdated remote with `h2 machine update box`.
- Remove a machine entry locally without stopping remote agents via `h2 machine rm box`.
