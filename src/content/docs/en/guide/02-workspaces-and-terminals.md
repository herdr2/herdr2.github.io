---
title: "02. Workspaces, Terminals & Code Panels"
description: "Master Space/Tab/Split layouts, persistent Ghostty real terminals hosted by h2, plus the Files, Changes, and Flash Notes panels."
---
> This chapter explains how to organize multi-project parallel development with the **Space → Tab → Split** hierarchy, master Ghostty real terminals and `h2` background hosting, and get the most out of the built-in **Files**, **Changes**, and **Flash Notes** panels.

---

## 1. Three-Level Hierarchy: Spaces, Tabs & Splits

Herdr2 organizes your daily engineering context into three clean layers:

| Level | Responsibility | Naming Rule | Typical Usage |
| --- | --- | --- | --- |
| **Space (Workspace)** | Maps to a project repo or service directory (bound to a host) | Automatically follows the first terminal's repo/directory name until manually renamed with `Shift+F2` | `order-service`, `docs-lab`, `prod-server/api` |
| **Tab** | A subtask context within a Space | Numbered `1, 2, ...` by default; press `F2` to rename | `dev-shell`, `tests`, `refactor-agent` |
| **Split (Pane)** | Side-by-side or stacked view cards inside a Tab | Freely mixes real terminals, ACP chats, and Mod panels | Edit code / run a server on the left; run tests or tail logs on the right |

### 1.1 Splitting & Rearranging Panes

In any Tab, press **`Ctrl+Shift+O`** to split right or **`Ctrl+Shift+E`** to split down. Each Split pane has its own card header (showing the shell/program name, working directory, and Git status), and you can drag the header handle to swap positions or merge panes.

![Side-by-side split terminals in action](/images/docs/04-split-terminals.png)

:::tip
Look at the `dev-shell` tab in the screenshot above: once split, the tab automatically displays a pane-count badge indicating it holds 2 concurrent panes. Whenever you need to expand one pane to full screen to read long logs, press **`Ctrl+Shift+Z`** to zoom-focus it, and press it again to restore the split layout.
:::

### 1.2 Essential Shortcuts Cheat Sheet

| Action | Default Shortcut (Linux/Windows) | Command (`herdr2 do`) |
| --- | --- | --- |
| New Space / Switch to Space 1–9 | `Ctrl+Shift+N` / `Alt+1..9` | `space.new` / `space.select` |
| Rename current Space | `Shift+F2` | `space.rename` |
| New Tab / Close Tab | `Ctrl+Shift+T` / `Ctrl+Shift+W` | `tab.new` / `tab.close` |
| Switch to Tab 1–9 / Previous & Next Tab | `Ctrl+1..9` / `Alt+[`, `Alt+]` | `tab.select` / `tab.prev`, `tab.next` |
| Rename current Tab | `F2` | `tab.rename` |
| Split Right / Split Down | `Ctrl+Shift+O` / `Ctrl+Shift+E` | `pane.split` |
| Move focus between panes | `Alt+H/J/K/L` or `Alt+Arrow Keys` | `pane.go` |
| Swap with adjacent pane | `Alt+Shift+H/J/K/L` | `pane.swap` |
| Zoom / Unzoom current pane | `Ctrl+Shift+Z` | `pane.zoom` |
| Close current pane | `Ctrl+Shift+X` | `pane.close` |
| Terminal Search / Copy / Paste | `Ctrl+Shift+F` / `Ctrl+Shift+C` / `Ctrl+Shift+V` | `terminal.search` / `copy` / `paste` |
| AI Prompt Polish / Undo Polish | `Ctrl+Alt+P` / `Ctrl+Alt+U` (`Cmd` on macOS) | `prompt.polish` / `prompt.polish_undo` |
| Collapse / Expand left sidebar | `Ctrl+Shift+B` | `layout.toggle` (`sidebar`) |
| Command Palette / Settings / Keybindings Help | `Ctrl+Shift+P` / `Ctrl+,` / `Ctrl+Shift+/` | `app.palette` / `app.settings` / `app.help` |

:::note
Every shortcut can be customized visually under **Settings → Keybindings**, or by editing `~/.config/herdr2/keys.json` directly (hot-reloads immediately).
:::

---

## 2. Ghostty Real Terminals & `h2` Background Hosting

Every terminal pane in the desktop app is a real PTY session (`t1`, `t2`, ...) hosted by `h2` and GPU-rendered via the built-in **`libghostty-vt`** engine:
- Full support for 24-bit TrueColor, modern shell prompts (Starship / Oh My Zsh), Vim / Neovim, tmux / htop, and clipboard image paste (`Ctrl+V` on a remote terminal even automatically uploads the clipboard image as a temporary remote file).
- Whenever an active terminal or agent address appears in terminal output (such as `a1`, `t2`, or `devbox/a3`), **`Ctrl+Click`** (`Cmd+Click` on macOS) to **Peek** at that session in-place.

### Controlling Background Terminals with `h2` CLI

In addition to typing directly in the desktop app, you or your AI agents can orchestrate and automate any terminal via the `h2` CLI:

```bash
# Launch an interactive command hosted in the background by h2 (non-agent, e.g., a dev server or build watcher)
h2 run --bg --cmd "npm run dev" --cwd /path/to/repo --name dev-server

# List all terminals and agents
h2 ls

# Send text or keystrokes to a specific terminal (e.g., Enter \r or Ctrl-C)
h2 send t1 "git status -s\r"

# Read a snapshot of the terminal screen or scrollback history
h2 read t1

# Attach live to a background terminal; press Ctrl-] to detach without terminating the process
h2 attach t1

# Terminate a terminal and any subagents it spawned
h2 kill t1
```

When a terminal is marked `keep` (terminal panes opened from the desktop app default to `keep: true`), Herdr2 preserves its address and workspace layout in the same directory even across daemon restarts.

---

## 3. Right-Hand "Files" Panel: File Tree & Syntax-Highlighted Preview

Click **Files** in the top-right corner to slide open the project file explorer for the active Space:

![Right-hand Files panel with syntax-highlighted preview](/images/docs/05-files-panel.png)

Key capabilities:
- **Lazy-loaded tree + Git status badges**: Modified and added files display `M` / `A` markers directly in the tree so you can spot your active footprint at a glance.
- **Syntax highlighting & jump-to-line**: Supports syntax highlighting across mainstream languages. Clicking a file path link inside a terminal or chat (e.g., `src/pricing.py:22`), or running `herdr2 do files.open '{"path":"...","line":22}'`, opens the file and highlights the target line (such as line 22 above).
- **Quick edit & inline review comments**: The top toolbar lets you toggle **Edit Mode**, attach line-level **Review Comments** and send them directly to the active agent to fix, or copy code in one click.

---

## 4. Right-Hand "Changes" Panel: Live Git Diff & One-Click AI Commits

Click **Changes** in the top-right corner to inspect all unstaged, staged, and untracked changes in the current Git repository:

![Right-hand Changes panel with live Git Diff](/images/docs/06-changes-panel.png)

Key capabilities:
- **File-level summary & status pills**: The header shows the active branch and HEAD commit (e.g., `main 8021761`), grouping changed files under Unstaged / Untracked with `+N / -M` line counts.
- **Unified and Split diff views**: Toggle between **Unified** and **Split** diff modes in the top-right corner, with additions and deletions highlighted in soft green and red.
- **Line-level review feedback**: Annotate specific lines right inside the diff view and feed structured review feedback (file path + line numbers + comment) directly to the collaborating agent.
- **Built-in commit box + AI-generated commit messages**: No need to switch back to a terminal to type `git commit -m`. Enter a commit message directly—or click **AI Generate** to let Global Core AI draft a clean commit message from the actual diff—then click **Commit**.

---

## 5. Flash Notes: Capture Ideas Instantly, Dispatch Anytime

Thought of an edge case, a missing test, or a refactoring idea while you're busy debugging something else?

Look at **Flash Notes** in the bottom-left corner:
1. Click `+` to jot down a quick note (multiple notes queue neatly and persist per Space).
2. Whenever you or an agent frees up, dispatch any Flash Note directly to a chosen agent in one click—or hit **AI Polish** first to expand the rough note into a crisp engineering task before sending it.

---

**Previous**: [← 01. Installation, Quick Start & UI Tour](/en/guide/01-getting-started/) | **Next**: [03. Headless ACP Agents & Permission Control →](/en/guide/03-headless-acp-agents/)
