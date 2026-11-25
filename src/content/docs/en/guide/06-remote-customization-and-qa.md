---
title: "06. Remote Hosts, Deep Customization & Automated QA"
description: "SSH multi-machine federation, three built-in layouts with hot-reloading Mods/Layouts, and the isolated sandbox automated QA framework."
---
> This chapter is for power users bringing Herdr2 into heavy production workflows: how to federate remote Linux servers and WSL instances into a single desktop window over SSH, how to hot-customize themes, layouts, and Mod panels, and how to run zero-pollution automated regression checks with the built-in sandboxed QA framework.

---

## 1. Multiple Machines, One Unified Window (SSH Remote Hosts)

If you write frontend code on your laptop, run heavy builds on a Linux build server, or run containers inside WSL, the traditional workflow forces you to juggle fragile SSH windows that drop whenever your connection blips.

Herdr2 lets you attach any SSH-accessible host directly into your local desktop window:
- Each remote host runs its own independent `h2` daemon—**even if your laptop sleeps, loses Wi-Fi, or restarts the desktop app, remote terminals and ACP agents keep running uninterrupted on the server**.
- Upon reconnecting, workspaces, split panes, scrollback history, and running agent states automatically resynchronize.

Press `Ctrl+,` and navigate to **Settings → Machines** (or click `+ Add Machine` at the bottom of the left sidebar):

![Settings -> Machines remote host management page](/images/docs/14-settings-machines.png)

### Adding & Managing Remote Hosts via CLI

```bash
# Add an SSH remote host (auto-detects and guides remote h2 installation if needed)
h2 machine add buildbox user@192.168.1.50

# Check online status and versions for all configured machines
h2 machine ls

# Spawn a background command or ACP agent directly on a remote host
h2 run --on buildbox --bg --cwd /data/aosp --agent claude --prompt "Analyze the build failure logs"

# Inspect and interact with remote sessions using unified <machine>/<address> addressing
h2 ls --on buildbox
h2 read buildbox/a1
h2 attach buildbox/t1
```

:::tip
Tabs and workspaces created on remote hosts are automatically grouped by machine in the left sidebar. Better yet, when you press `Ctrl+V` to paste a local screenshot inside a remote workspace, Herdr2 automatically syncs the image to a temporary file on the remote host and pastes its remote path straight into the terminal!
:::

---

## 2. Look & Feel, Three Built-In Layouts & Deep Customization

The Herdr2 desktop app follows a distinctive design philosophy: **the entire UI is defined as readable, cloneable local files with sub-second hot reload** (stored under `HERDR2_APP_HOME`, defaulting to `~/.config/herdr2` or the platform's standard config directory).

### 2.1 Out-of-the-Box Look & Layout Switching

Open **Settings → Look**:

![Settings -> Look and Layout configuration page](/images/docs/13-settings-look.png)

You can adjust the following live without restarting:
- **UI Language**: Switch between `English` and `简体中文` instantly.
- **Three Built-In Layouts** (also cyclable via `Ctrl+Shift+L`):
  1. **`Herdr2` (`main`)**: The default full-featured workbench (left Workspaces / Agents / Flash Notes, center card splits, right Files / Changes / Checkpoints panels).
  2. **`Terminals`**: Minimalist multi-terminal layout (tabs merged into the top bar to maximize terminal viewport area).
  3. **`Herdr 98` (`win98`)**: A retro desktop Easter-egg layout that doubles as a complete showcase of the Mod system's expressive power.
- **Right-Panel Toggles**: Choose which auxiliary panels (`Files`, `Changes`, `Checkpoints`) are enabled by default in workspaces.
- **Appearance Mode & Themes**: System / Light / Dark modes, plus multiple built-in color palettes and custom `themes/<name>.json` files.

### 2.2 Cloning Layouts & Writing Custom Mods (Hot Reload)

Herdr2's built-in layouts (`layouts/`) and panel modules (`mods/`) stay automatically updated across upgrades. When you want to tweak the structure or build your own custom sidebar panel (such as *"My Open PRs"* or *"Server GPU Monitor"*), **clone first, then edit**—your window hot-reloads within 1 second of saving:

```bash
# Clone the default layout into a personal layout and switch to it immediately
herdr2 do layout.clone '{"name":"main","as":"my-layout"}'

# Clone the built-in Files panel as a starting point for a custom Mod
herdr2 do mod.clone '{"name":"files","as":"my-files"}'

# Statically validate a custom Mod's initial descriptor and native element bindings
herdr2 check ~/.config/herdr2/mods/my-files

# Hot-reload all Mods without closing the window or interrupting any terminal
herdr2 do app.reload_mods
```

:::note
**Always-Available Escape Hatch: `Ctrl+Alt+Shift+Esc`**
No matter how badly a custom layout or keybinding edit breaks your UI, pressing `Ctrl+Alt+Shift+Esc` backs up the broken config files as `*.reset-<timestamp>` and immediately restores the default `main` layout. This shortcut cannot be overridden by any configuration.
:::

### 2.3 Programmatic Desktop Control (`herdr2 do` / `herdr2 shot`)

The Herdr2 desktop app exposes a complete local control CLI—ideal for scripting, demo recording, and UI debugging:

```bash
# List all 94 supported desktop commands and their argument schemas
herdr2 commands

# Inspect current window focus, workspaces, and tab state (JSON)
herdr2 status
herdr2 ls

# Execute any desktop command programmatically
herdr2 do app.language '{"language":"zh-CN"}'
herdr2 do files.open '{"path":"/path/to/file.py","line":42}'

# Capture a physical-pixel PNG screenshot of the window without screen-recording permissions
# (Every desktop screenshot in this guide was generated this way!)
herdr2 shot ./window-preview.png
```

---

## 3. Isolated Sandbox & Automated AI QA (Developer / Contributor Guide)

If you are extending Herdr2, building custom Mods, or validating end-to-end regressions before submitting a PR, the repository includes a **fully isolated automated testing and regression QA framework** (`qa/` + `scripts/qa/`).

### Why "Zero Pollution"?

Every sandbox test runs through `scripts/qa/sandbox.sh`, creating completely isolated `H2_SESSION`, `XDG_CONFIG_HOME`, `XDG_STATE_HOME`, and `HERDR2_APP_HOME` directories under `/var/tmp/herdr2-qa-<name>`, alongside a dedicated `Xvfb` virtual display and randomized `H2_DROVE_PORT`, while actively scrubbing host environment variables. **It will never interfere with your live Herdr2 window or active `h2` sessions.**

### Common QA Commands Quick Reference

```bash
# 1. Catalog drift and contract sync check (verifies coverage across 80 Core RPCs, 94 App commands, 25 Mods)
python3 scripts/qa/sync_check.py --drift

# 2. Run desktop frontend Mod unit tests (Bun)
cd herdr-app && bun test scripts/*.test.ts

# 3. Run the full tiered automated test suite in one command:
#    L0 (static checks & unit tests) + L1 (Core headless ACP / permissions / checkpoints / MCP / Drove)
#    + L2 (headless GPUI desktop live run & screenshots) + L3 (headless Chrome probes verifying Drove Web)
python3 scripts/qa/runner.py --tier L0,L1,L2,L3

# 4. Manually drive an isolated sandbox to reproduce an issue, capture screenshots, then clean up completely
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app-up
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app do app.settings '{"section":"drove"}'
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh app shot /tmp/repro.png
HERDR2_QA_SANDBOX=my-repro bash scripts/qa/sandbox.sh clean
```

Every `runner.py` invocation writes structured `results.json`, a human-readable `summary.md`, and real rendered `evidence/*.png` screenshots under `qa/reports/<timestamp>/`, making it easy for you or an AI agent to diff and pinpoint visual or interaction regressions.

---

## Closing

You have now covered the full Herdr2 toolkit—from core terminal workspaces, headless ACP agents and permission arbitration, context handoff and Git checkpoints, all the way to Drove multi-agent DAG orchestration, SSH multi-machine federation, and deep customization.

Whenever you're unsure about a shortcut or command, press **`Ctrl+Shift+P`** to search the Command Palette, or run **`h2 --help`** and **`herdr2 commands`** in your terminal. Happy building!

---

**Previous**: [← 05. Drove Multi-Agent DAG Orchestration](/en/guide/05-drove-orchestration/) | [Back to Guide Home](/en/guide/)
