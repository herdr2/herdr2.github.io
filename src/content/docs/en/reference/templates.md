---
title: "Agent Templates"
description: "Save reusable ACP presets, models, permission policies, and opening instructions as templates."
---
Save an ACP preset, command, model, permission policy, and opening instructions once, then start the role by name.

[Back to the README](https://github.com/herdr2/herdr2) · [Command reference](/en/reference/commands/#h2-templates)

## Make a reviewer

Save this as `~/.config/herdr2/templates/reviewer.md` on Linux or macOS (`%APPDATA%\herdr2\templates\reviewer.md` on Windows, or under `$XDG_CONFIG_HOME/herdr2/templates`):

```markdown
---
description: Read-only code review. Give it file paths and scope.
agent: claude
model: sonnet
permissions: approve-reads
---
You are a focused review agent. Read the code before giving findings.
Do not edit files or start other agents.
Report bugs with file paths, lines, and a short reason.
If a parent assigned the review, report back with `h2_send` or `h2 send`.
```

Launch and interact with it:

```sh
h2 templates
h2 run --bg --name review --cwd /path/to/repo reviewer "Review src/x.rs only."
h2 wait review
h2 read review --last
h2 send review "Recheck the error path."
```

Without `--bg`, `h2 run` waits for the first ACP turn to finish and prints the transcript.

## File format

Each template is one Markdown file ending in `.md` (the filename without `.md` is the template name; files are read fresh on every use).

Start and close frontmatter with `---` lines using simple `key: value` pairs (no YAML quotes or multiline values):

| Field | Meaning |
| --- | --- |
| `agent` | ACP preset (`claude`, `codex`, `gemini`, `opencode`, `copilot`, `cursor`, `kimi`, `qwen`, `pi`) or custom command string (required unless `command` is set). |
| `command` | Alternative ACP command line if `agent` is omitted. |
| `description` | Short description shown by `h2 templates`. |
| `model` | Optional model passed to ACP `session/set_config_option` (`model`). |
| `mode` | Optional ACP session mode passed to `session/set_mode`. |
| `permissions` | Override default permission policy (`approve-all`, `approve-reads`, `deny-all`, `ask`). |
| `inject_mcp` | `true` or `false` (overrides global `inject_mcp` setting unless `--no-mcp` is passed). |
| `system_prompt` | Text passed via `_meta.systemPrompt` when creating the ACP session. |

The Markdown body is placed before your task prompt (separated by a blank line) and queued into the agent's ACP inbox as soon as `session/new` finishes.

When launched with `--on`, the remote machine resolves the template and spawns the ACP session there.
