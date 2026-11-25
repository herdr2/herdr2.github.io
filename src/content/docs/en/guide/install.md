---
title: "Install & Upgrade (herdr2-install Skill)"
description: "Use the herdr2-install Agent Skill to let your AI coding assistant automatically install and upgrade Herdr2 Desktop, the h2 daemon, and companion skills."
---

:::tip[Recommended Installation Method: `herdr2-install` Skill]
Herdr2 is installed and upgraded across macOS, Linux, Windows, and WSL using the **`herdr2-install`** Agent Skill — no need to pick installers manually or configure `PATH` by hand.
:::

## One-Step Installation

Send the following message directly to your AI coding assistant (**Antigravity, Claude Code, Codex, Cursor, OpenCode, Windsurf**, etc.):

```text
Read https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md and follow the herdr2-install skill steps to install Herdr2 (Desktop app + h2 core + companion skills) on this machine.
```

> If GitHub Raw is slow on your network, you can point your AI assistant to the static mirror hosted on this site: [`/skills/herdr2-install/SKILL.md`](/skills/herdr2-install/SKILL.md).

---

## What `herdr2-install` Automates for You

1. **Detects Platform & Architecture**: Automatically identifies macOS (Apple Silicon), Linux, Windows, or WSL.
2. **Downloads & Installs Latest Herdr2**: Fetches the matching desktop package and `h2` core daemon, and wires up `PATH`.
3. **Starts & Verifies the Daemon**: Checks `h2 --version` and `herdr2 --version`, then starts the persistent `h2 server`.
4. **Injects Companion Skills**: Runs `h2 skill install --all` to install `herdr2`, `drove`, `drove-add`, and `drove-setup` into all detected coding agents.
5. **Guides Core AI Setup**: Launches Herdr2 Desktop so you can configure the built-in global Core AI in the Welcome wizard (DeepSeek / any OpenAI-compatible API recommended); future upgrades are applied in-app via the top-right **Update** button without interrupting running agents.

---

## Starting Multi-Agent Workflows in Herdr2

You do not need to type `h2` CLI commands in day-to-day work — everything runs inside **Herdr2 Desktop + companion skills**:

1. **Open Herdr2 Desktop & Add a Workspace**: Finish the Welcome wizard (including global Core AI setup), then click `+` next to **Spaces** to open your repository.
2. **Start a Lead Agent**: Click `+` on the top tab bar to launch your preferred agent (Claude Code, Codex, Antigravity, Cursor, Gemini, etc.).
3. **Orchestrate with Companion Skills**:
   - **`/drove-setup`**: Configure role bindings (`coder` / `tester` / `reviewer` / `writer` / `researcher`) and thinking effort in **Settings → Drove** or via chat.
   - **`/drove <your engineering goal>`**: Your lead agent plans a task DAG and dispatches headless worker agents in isolated Git worktrees with automatic verification gates and cross-model reviews.
   - **`/drove-add <follow-up request>`**: Hot-append follow-up tasks directly onto warm `idle` workers without losing context.

---

## View the Raw Skill File

- GitHub Source: [`skills/herdr2-install/SKILL.md`](https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md)
- Static Site Mirror: [`/skills/herdr2-install/SKILL.md`](/skills/herdr2-install/SKILL.md)
- Next Step: Read **[01. Install & Getting Started](/en/guide/01-getting-started/)**
