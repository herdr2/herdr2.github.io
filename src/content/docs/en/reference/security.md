---
title: "Security & Trust Model"
description: "Execution boundary, permissions, and security guidance for Herdr2 Core."
---
Core runs ACP agents and commands with your account's access.

[Back to the README](https://github.com/herdr2/herdr2) · [API](https://github.com/herdr2/herdr2/tree/main/herdr-core/schema)

## What runs

The CLI starts a background core daemon when needed.
Core spawns ACP adapters directly over stdio pipes (without PTYs, shells, or holder processes) using the running account's filesystem and network access.
Templates and presets launch the configured agent commands as your account.

Do not run core as root or as an administrator unless you intend to give its clients that access.
ACP permission policies (`approve-reads` default) gate adapter tool permission requests via `blocked` state, while OS/container isolation remains the agent sandbox boundary.

## Who can connect

On Unix, core listens on a local Unix socket, not a public TCP port.
It creates its state and socket directories with mode `0700`.
It does not repair permissions on directories that already exist.
Keep custom socket paths in directories only your account can enter.
There is no separate API password or per-client permission check.

On Windows, core uses named pipes whose ACLs allow the current account and `SYSTEM`.

## Sessions and coexistence

The default session is named `default`.
Setting `H2_SESSION` selects an isolated core, agent registry, transcripts, and endpoint:

```sh
H2_SESSION=scratch h2 ls
```

`herdr2` (`h2`) uses separate binary names, environment variables (`H2_*`), runtime sockets, and config/state directories from `herdr-core` (`hc`), allowing both to run simultaneously on the same host without conflict.
Config and templates are shared across `herdr2` sessions under the same config home.
Tests should use a dedicated `H2_SESSION` and scratch XDG directories so they do not touch your live state or config.

## Remote trust

SSH handles login, host keys, and encryption. Core carries its protocol through that connection.
A custom `--via` command must provide its own trust and transport guarantees.
Adding a machine gives local clients access to that remote `herdr2` core's agents, commands, and files.
Forgetting a machine removes the connection here, leaving remote agents running.
See [machines](/en/reference/machines/).

## State and endpoints

| Item | Default |
| --- | --- |
| Unix state | `~/.local/state/herdr2/<session>/` |
| Unix config | `~/.config/herdr2/config.toml` |
| Windows state | `%LOCALAPPDATA%\herdr2\<session>\` |
| Windows config | `%APPDATA%\herdr2\config.toml` |
| Templates | `templates/` beside `config.toml` |

`XDG_STATE_HOME` and `XDG_CONFIG_HOME` override the state and config homes on both platforms.
On Unix, sockets live under `$XDG_RUNTIME_DIR/herdr2/<session>.sock` when set, falling back to `/run/user/<uid>/herdr2/` and then the session's state directory.
`H2_SOCKET` overrides the client endpoint (else `socket` in `config.toml`).

State includes `agents.json`, per-agent JSONL transcripts under `transcripts/<address>.jsonl`, `machines.json`, `peers.json`, `docs.json`, and `core.log`. Treat the state directory as private since transcripts may contain secrets.

## Updates and signing

```sh
h2 update
h2 update --version 0.2.0
```

Release installers and updates verify archive SHA-256 digests from the release manifest (`HERDR2_RELEASES_URL` overrides the default URL).
On macOS per-user home installs, `Herdr2.app` is installed under `~/.local/share/herdr2/active/Herdr2.app` with links in `~/.local/bin` and identifier `dev.herdr2.core`.
`h2 update --from /path/to/herdr2` installs a trusted local build.
