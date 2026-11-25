---
title: "01. Installation, Quick Start & UI Tour"
description: "Install and verify Herdr2 across platforms, understand the dual-plane architecture and essential Core AI Welcome wizard, and complete a 5-minute native CLI + Prompt Polish & ACP workflow."
---
> This chapter walks you through installing and verifying Herdr2, understanding its core dual-plane architecture, touring the 5 main regions of the interface, and running a 5-minute hands-on workflow: **using a native CLI agent (Claude Code) for everyday coding**, paired with a **headless ACP agent**, real-time Git Diff, and persistent background hosting.

---

## 1. Installing Herdr2

Herdr2 consists of two components: the **background daemon & CLI (`h2`)** and the **native desktop app (`herdr2`)**. Official installers bundle both, and you can install via **AI one-click installation** or **platform-specific manual installation**.

### 1.1 Recommended: Let Your AI Assistant Install It

If you already use an AI coding assistant locally (Antigravity, Claude Code, Codex, Cursor, OpenCode, etc.), the fastest approach is to hand it the built-in [`herdr2-install` Skill](/en/guide/install/)—just send your AI agent this prompt:

```text
Please read https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md and follow the steps to install and configure Herdr2 on this machine.
```

It automatically detects your OS and CPU architecture, fetches the matching installer from [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest), verifies `PATH` and the `h2` daemon, and injects the companion Agent Skills.

### 1.2 Manual Installation by Platform

#### macOS (Apple Silicon)

- **One-line script (recommended)**: Automatically installs `~/Applications/Herdr2.app` and symlinks `herdr2` and `h2` into `~/.local/bin`:
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
  ```
- **Manual installer**: Download `Herdr2-<version>-macos-aarch64.dmg` from [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest), drag it into `Applications`, and optionally symlink `Herdr2.app/Contents/MacOS/Herdr2` and `Herdr2.app/Contents/Helpers/h2` to `~/.local/bin`.

#### Linux / WSL

- **Debian / Ubuntu (`.deb` package, includes desktop app, `h2`, and desktop entry)**:
  Download `herdr2_<version>_amd64.deb` from [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) and run:
  ```bash
  sudo apt-get install -y ./herdr2_<version>_amd64.deb
  ```
- **Generic distros / without `sudo`**:
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.sh | sh
  ```
- **Headless Linux servers or inside WSL (installs `h2` daemon & CLI only, no GUI)**:
  ```bash
  curl -fsSL https://github.com/herdr2/herdr2/releases/download/ota-latest/core-install.sh | sh
  ```

:::tip
**Recommended setup for WSL users**: Install the Herdr2 desktop app on the Windows host, and install the Linux `h2` core inside WSL using `core-install.sh` above. You can then manage WSL and remote Linux workspaces seamlessly from a single Windows desktop window.
:::

#### Windows (x64)

- **Graphical installer (recommended, no admin rights required)**: Download `Herdr2-Setup-<version>-windows-x86_64.exe` from [GitHub Releases](https://github.com/herdr2/herdr2/releases/latest) and double-click to install (installs the desktop app to `%LOCALAPPDATA%\Programs\herdr2`, `h2` to `%LOCALAPPDATA%\Programs\h2`, and updates your user `PATH`).
- **PowerShell one-liner**:
  ```powershell
  irm https://github.com/herdr2/herdr2/releases/download/ota-latest/app-install.ps1 | iex
  ```

### 1.3 Verify Installation & Inject Companion Skills

After installation, make sure `~/.local/bin` (macOS / Linux) or `%LOCALAPPDATA%\Programs\h2` and `%LOCALAPPDATA%\Programs\herdr2` (Windows) are on your `PATH`, then run in a new terminal:

```bash
# 1. Verify binary versions
h2 --version
herdr2 --version

# 2. Start and check the h2 background daemon
h2 server start
h2 server status
```

**Recommended: inject companion Skills**: Run the following commands to automatically install `herdr2`, `drove`, `drove-add`, and `drove-setup` into all detected local coding assistants (Antigravity, Claude Code, Codex, Cursor, OpenCode, Windsurf, etc.), giving them native mastery of `h2` orchestration:

```bash
h2 skill install --all
h2 skill status
```

:::note
**No need to reinstall for future updates**: Once installed, Herdr2 supports built-in **one-click OTA hot updates**. Whenever a new release is available, an **Update** button appears in the top-right corner of the desktop window—clicking it deploys the update seamlessly without interrupting background terminals or running agents.
:::

---

## 2. Why a Dual-Plane Architecture?

Traditional terminal multiplexers (like tmux) excel at keeping shells alive, but trap AI coding conversations, code diffs, and permission approvals inside raw ANSI byte streams. Meanwhile, mainstream IDEs and AI desktop apps offer polished visuals and restore chat history on restart, yet still bind running local terminals and live agents to the window lifecycle—closing the window, restarting for an update, or dropping a remote connection kills active processes, and you cannot easily inspect or steer them from a plain CLI over SSH or scripts.

Herdr2 splits the system into two decoupled planes:

![Herdr2 dual-plane decoupled architecture](/images/docs/diagram-dual-plane-architecture.svg)

Immediate benefits:
1. **Never drop a session**: Accidentally closing the window, upgrading the Herdr2 desktop client, or closing your laptop and dropping SSH won't stop local or remote terminals and agents running inside `h2`.
2. **One screen, multiple machines**: Your local machine, WSL, Linux build servers, and macOS hosts connect into the same desktop window, letting you switch across hosts as effortlessly as switching local folders.
3. **CLI and GUI from one source of truth**: Every click in the desktop UI maps to a standard command (`herdr2 do <command>`) or an underlying `h2` RPC—equally friendly to mouse users and automation scripts.

---

## 3. First Launch & Welcome Wizard

Once `h2 server status` reports healthy, launch the desktop app by running `herdr2` from the command line (or opening `Herdr2` from Applications / Start Menu). On first launch, Herdr2 displays the **Welcome** wizard:

![Herdr2 first-launch Welcome wizard](/images/docs/01-welcome.png)

In the Welcome wizard, you complete two essential setup steps:
1. **Appearance & language preferences (Page 1—takes effect immediately, no restart needed)**:
   - **Interface language**: Switch live between `English` and `简体中文` (you can also switch anytime under **Settings → Appearance** or via `app.language`).
   - **Theme mode**: Choose `System`, `Light`, or `Dark`.
   - **UI scale**: Use `-` / `+` to adjust the global font size and zoom level (or tweak anytime with `Ctrl+=` / `Ctrl+-` / `Ctrl+0`).
2. **Configure the Global Core AI Assistant (essential)**: Enter any **OpenAI-compatible API endpoint** (we recommend the **official DeepSeek API**: `https://api.deepseek.com/v1` + `deepseek-chat`; corporate gateways and local `Ollama` / `vLLM` servers are also supported) and click Test Connection to verify.

:::note
**Make sure to complete Core AI setup—AI capabilities are the heart of Herdr2!**
Herdr2 is far more than a terminal wrapper. Its built-in Global Core AI runs through the entire workflow:
- **✨ Prompt Polish (`Ctrl+Alt+P`)**: Rewrite rough, conversational drafts in-place into structured engineering prompts across native CLI terminals, ACP chat inputs, and Flash Notes (with instant undo via `Ctrl+Alt+U`);
- **Smart CLI terminal status detection**: Accurately detects when a coding CLI inside a terminal is thinking, errored out, or blocked waiting for permission approval;
- **End-to-end daily productivity**: **AI-generated commit messages** in the Changes panel, cross-agent **Handoff / Fork summaries & smart recommendations**, **Catch-up briefings**, **Checkpoint failure diagnosis**, and **automated Drove role configuration**.

Core AI uses lightweight calls with on-demand caching so per-call cost is negligible. See [Chapter 04: Global Core AI & Prompt Polish](/en/guide/04-handoff-checkpoints-and-ai/#1-global-core-ai-assistant-the-essential-hub-of-herdr2) for full setup details and capabilities.
:::

:::tip
To reopen the Welcome wizard later, press `Ctrl+Shift+P` to open the Command Palette and search for "Welcome" (or run `herdr2 do app.welcome`). You can also press `Ctrl+,` anytime to update **Settings → AI Assistant**.
:::

---

## 4. The 5 Core Regions of the Main Interface

After finishing the wizard and opening your first project folder, you will see Herdr2's default layout (`main`):

![Annotated overview of the 5 core regions in Herdr2's main workbench](/images/docs/02-workspace-overview-annotated.png)

Following the numbered callouts above, the window is organized into **5 clear functional regions**:

1. **Top-left "Spaces" list**:
   - Each Space represents a project directory (such as `order-service` and `docs-lab` above); Spaces on remote SSH hosts are automatically grouped by host.
   - Click `+` on the right to create a Space, drag items to reorder them, or click the search icon at the top to jump quickly.
2. **Middle-left "Agents" live status rail**:
   - Aggregates all active **headless ACP agents (`a*`)** and **coding CLIs running inside interactive terminals**.
   - Automatically sorts and pins by urgency: **Blocked (red `!` badge) > Done > Working > Idle**.
   - When a parent agent spawns subagents, they nest as a collapsible tree under the parent—click the disclosure arrow on the left to expand.
   - The header includes a red **Quick Look** pill (jump straight to sessions needing attention), a Trash icon (restore accidentally closed sessions), and a History entry.
3. **Bottom-left "Flash Notes" & global actions**:
   - Click `+` anytime to jot down an idea or TODO and dispatch it to any agent when ready.
   - Pinned at the very bottom are **Settings (`Ctrl+,`)** and **Add Host (SSH)**.
4. **Top "Tab Bar" & right-hand panel toggles**:
   - The left side shows all Tabs in the current Space (such as `dev-shell`, `tests`, plus ACP chats like `a1` and `a2` opened as tabs). Click `+` to open a new shell or launch an installed AI CLI / ACP agent directly.
   - The top-right corner pins toggles for three workspace utility panels—**Files**, **Changes**, and **Checkpoints**—each remembering its open/closed state per Space.
5. **Center "Main Canvas" & bottom "Status Bar"**:
   - The center displays one or more split cards hosting real terminals or ACP chat views. Each card header shows the working directory and Git branch/dirty count (e.g., `main · 2 changes`).
   - The bottom status bar summarizes the current host, Git branch, active agent count, and blocked count, with a `Ctrl+Shift+P Command Palette` hint on the right.

---

## 5. Command Palette: The Only Shortcut You Need to Remember

You don't need to memorize every keybinding when starting out. Press **`Ctrl+Shift+P`** (same on macOS, or check Keybindings settings) to summon the **Command Palette**:

![Herdr2 Command Palette](/images/docs/03-command-palette.png)

The Command Palette supports **fuzzy search in both English and Chinese**, listing all 94 application commands alongside their shortcut badges:
- Type `split` → find **Split Right (`Ctrl+Shift+O`)** and **Split Down (`Ctrl+Shift+E`)**.
- Type `changes` → open the Git Diff & commit panel.
- Type `handoff` → open the Handoff / Fork dialog.
- Type `layout` → switch between `Herdr2`, `Terminals`, and `Herdr 98` layouts.
- Press `Esc` to dismiss the Command Palette.

---

## 6. Hands-On Quick Start: Your First Dev Loop with CLI & ACP Agents

The core everyday workflow in Herdr2 is to **launch your favorite AI coding agent inside a Space—keeping 100% of its native CLI feel while layering on Herdr2's live status tracking, real-time Changes panel, and persistent background hosting**—and optionally mix in **headless ACP agents** in the same Space for code reviews or parallel tasks.

Below we walk through a complete 5-minute loop on a real sample repository (`order-service`), using **Claude Code** as an example (the same applies if you use `codex`, `gemini`, `opencode`, etc.).

### 6.1 Open a Space & Develop Inside a Native CLI Agent

1. **Open a local Git repository**: Click **`+`** next to Spaces in the sidebar (or press `Ctrl+Shift+N`) and pick your project folder. Herdr2 creates a Space and opens a default shell tab (`dev-shell`).
2. **Launch Claude Code CLI**: Click **`+`** on the right of the top Tab Bar and choose **Claude Code** (or type `claude` in the terminal and press Enter). It runs inside Herdr2's built-in Ghostty real terminal, **preserving Claude Code's native TUI, slash commands, shortcuts, and input feel completely**.
3. **Use "✨ Prompt Polish" to turn a rough draft into a crisp prompt, then run the task**:
   - Type a quick conversational idea into the Claude Code input box, e.g., `add a NEW10 10% off code to pricing and also add unit tests and run them`.
   - **Press `Ctrl+Alt+P`** (`Cmd+Alt+P` on macOS), or click **✨ Polish** on the card's top toolbar: Herdr2's Core AI uses your repository path and session context to rewrite your draft **in-place inside the CLI input box** into a clear, unambiguous engineering prompt (if you don't like the result, press **`Ctrl+Alt+U`** / `Cmd+Alt+U` on macOS to restore your original draft in a second; see [Chapter 04: Deep Dive — AI Prompt Polish](/en/guide/04-handoff-checkpoints-and-ai/#2-deep-dive-ai-prompt-polish)).
   - Press Enter to send. Claude Code edits the code and runs `python3 -m unittest`. Click **Changes** in the top-right corner to open the Git Diff panel and complete the full loop—**Polish & dispatch → native coding → review diff → commit**—all on one screen:

![Running Claude Code CLI in Herdr2's native terminal alongside the right-hand Changes panel](/images/docs/01-cli-agent-dev.png)

Notice the 4 key enhancements Herdr2 automatically adds around a native CLI agent:
- **Zero-intrusion card toolbar (with in-place Polish)**: Without interfering with the terminal below, the card header offers **✨ Polish**, **Side-chat**, **Fork**, **Handoff**, **Send Context**, and a live Git status pill (`main · 2 changes`).
- **Automatic status tracking in the left Agents rail**: Claude Code inside the terminal (`t3 · CLI`) automatically reports its state—showing **Working** while active, pinning in red as **Blocked** when awaiting approval, and switching to **Done** upon completion—so you never miss an alert even when working in another tab.
- **Real-time Git Diff in the right Changes panel**: As soon as Claude Code edits `src/pricing.py` (`+2`) and `tests/test_pricing.py` (`+9`), the right panel highlights every changed line. Review the diff, then type a commit message at the bottom—or click **AI Generate**—and commit directly.
- **Instant Split panes for side-by-side debugging**: Press `Ctrl+Shift+O` to split right and open a regular terminal so you can run builds or tail logs while the agent edits code.

### 6.2 Launch a Headless ACP Agent in the Same Space (Structured Chat)

Alongside native CLI terminals, you can open a **headless ACP agent** in the same Space—ideal for code reviews, architecture research, or parallel work on another module:

- **Launch from Desktop**: Click **`+`** on the top Tab Bar (or press `Ctrl+Alt+N`), pick an installed agent preset (e.g., `Claude`), and open it in **ACP mode**.
- **Launch from CLI**: Spawn one from any terminal with `h2 run`, and it automatically syncs into the desktop's left-hand Agents list:
  ```bash
  h2 run --bg --name claude-review --agent claude --cwd /path/to/order-service \
    --prompt "Read src/pricing.py, briefly summarize the currently supported promo code rules, and point out 2 potential edge cases with improvement suggestions (analysis only, do not modify files)."
  ```

Here is the real view in the same `order-service` Space after **Claude ACP (`a1`)** finishes reviewing `src/pricing.py`:

![Running a headless Claude ACP agent in the same Space and viewing structured conversation output](/images/docs/01-acp-agent-chat.png)

Compared to native CLI mode, ACP mode gives you:
- **Clean structured conversation view**: Zero terminal escape noise, crisp Markdown lists and code blocks, a **Fork from here** button under every turn, and live context-window usage at the top (e.g., `Context 9%`).
- **Live parameter switching without restarting**: Click the selectors below the input box to switch **Model**, **Reasoning Effort**, and **Permission Mode** on the fly, attach images/files by drag-and-drop, and click **Polish** to refine prompts.
- **Unified monitoring across CLI and ACP**: In the left Agents rail, native terminal `t3 (CLI)` and headless session `a1 (ACP)` appear side by side with identical status badges, timers, and one-click switching.

:::tip
**How to choose between CLI mode and ACP mode?**
- **Prefer CLI mode (`t*`)**: For primary interactive coding where you want 100% of Claude Code / Codex / Gemini's native TUI, slash commands, and keybindings—augmented by Herdr2's multi-project management, live Diff, and background persistence.
- **Prefer ACP mode (`a*`)**: When you want structured formatting and collapsible tool cards, a queued **Inbox** with live interruption (`--steer`), inline permission approvals, or scriptable / multi-agent (**Drove**) orchestration (see [Chapter 03](/en/guide/03-headless-acp-agents/)).
:::

### 6.3 Verify Background Hosting & CLI Takeover

While `t3` (Claude Code CLI) and `a1` (Claude ACP) are still open, **close the Herdr2 desktop window and reopen it**—your Space, both agent sessions, full scrollback/history, and Git changes are completely intact.

Even without the desktop window (for example, when SSH'd into the machine), you can inspect, message, or attach to those exact same sessions via the `h2` CLI:

```bash
# List all background-hosted terminals (t*) and headless agents (a*)
h2 ls

# Read the native CLI terminal screen (t3), or read the latest reply from ACP agent (a1)
h2 read t3
h2 read --last a1

# Attach directly to a live CLI terminal from your shell (press Ctrl-\ then d to detach without killing it)
h2 attach t3

# Dispatch the next instruction to a background ACP agent from the CLI
h2 send a1 "Fix the case-normalization issue you just mentioned and make sure the unit tests pass"
```

---

**Next**: [02. Workspaces, Terminals & Code Panels →](/en/guide/02-workspaces-and-terminals/) | [Back to Guide Index](/en/guide/)
