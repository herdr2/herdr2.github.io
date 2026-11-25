---
title: "Cross-Provider Context Handoff and Unified Session Lineage"
description: "Architecture and implementation details for Context Handoff, Worktree Forking, and Unified Session Lineage."
---

## 1. Goals and Overall Architecture

This design implements the highest-leverage 20% of T3 Code Orchestration V2 across `herdr2` (`herdr-core` + `herdr-app`):

- **Cross-Provider Context Handoff (`Handoff` / `Fork` / `Side Chat` / `Merge Back`)**: Supports transferring context between any combination of headless ACP agents (`a*`) and interactive PTY terminal agents (`t*`), covering `a* / t* -> new a* / new t* / --into existing a*|t*`.
- **Lightweight Unified Session Lineage**: Records parent/branch/merge origins directly inside `Agent`, `Terminal`, Drove `Worker`/`Assign`, and transcript entries (`Entry::Handoff`)—reusing existing file-backed state and worktree models without introducing a heavyweight event-sourcing database.
- **Drove Automatic Fallback Retry Handover**: When a Drove DAG task retries (`retry_of`) or falls back to a different provider, Core automatically extracts the prior attempt's trajectory, failure reason, and change summary into the new worker's prompt, while preserving manual triggers and UI handoff entry points.

---

## 2. Core Design and Phased Implementation

### Step 1: Data Model, Transcript Enhancements, and Deterministic Context Packager (`herdr-core`)

1. **`api/types.rs` and `pty_transcript.rs`**
   - Added `provider: Option<String>` and `session_id: Option<String>` to `ReadSessionMeta`, and updated the Claude / Codex / Gemini / Pi / Agy CLI transcript parsers to extract the actual provider and underlying `session_id`.
   - Added `--from-turn` and `--to-turn` to `ReadParams` so receiving agents can slice and lazily re-read omitted earlier turns on demand.
2. **`transcript.rs`**
   - Added `Entry::Handoff { kind, from_address, from_provider, from_session_id, from_turns, artifact_path, ts_ms }` along with `turn()`, `approx_bytes()`, and `render_line()` implementations.
   - Extended `strip_h2_envelope` to filter internal `<herdr2-handoff ...>...</herdr2-handoff>` envelope tags.
   - Added the `slice_turn_range` helper for slicing transcript entries by turn range.
3. **`src/handoff.rs` (new module exported in `src/lib.rs`)**
   - Defined `LineageKind` (`Handoff` / `Fork` / `SideChat`), `Lineage`, and `HandoffPackage`.
   - Implemented the bounded deterministic context packager `build_handoff_package` (default 24 KiB budget):
     - Preserves the Turn 1 original objective + current `git status --short` + plan/latest summary;
     - Backfills recent turns and key artifacts in reverse chronological order;
     - Generates self-service lookup hints (`h2 read <source> --from-turn X --to-turn Y`) for middle turns collapsed due to budget limits.
   - Implemented `default_pty_argv` and unit tests.
4. **`agents.rs`, `terminals.rs`, `api.rs`, `mcp.rs`**
   - Added `lineage: Option<Lineage>` to `Agent`, `NewAgent`, `Terminal`, and `NewTerminal`.
   - Implemented `--from-turn` / `--to-turn` filtered reading in both `agent_read` and the `h2_read` MCP tool (supporting both `a*` and `t*`).

---

### Step 2: Unified `agent.handoff` RPC, CLI, MCP, and Hybrid Delivery Paths

- **`api/handoff.rs` + `api/types.rs` + `api.rs`**
  - Added `HandoffParams` and `HandoffResult` (avoiding any field named `first_message` to satisfy the `m0` OpenRPC contract test) and registered the `"agent.handoff"` RPC method.
  - Implemented dual-track delivery based on the target runtime:
    1. **Headless ACP Target (`a*`)**: Writes the full handoff package into `TargetCheckpoints.pending_handoff` (automatically prepended on Turn 1 by `acp/mod.rs::prepare_acp_prompt` without polluting the user-visible first message) and appends `Entry::Handoff` (Turn 0); if `prompt` is supplied, immediately starts the first turn.
    2. **Interactive PTY Target (`t*`)**: **Never uses `tc.pending_handoff`** (avoiding conflicts with Agy rollback prompts) and **never overwrites an already-running PTY pane**:
       - Same-provider CLI native `Fork` (e.g., Claude or Codex with a resolved `session_id`): Reuses `pty_adapters::{fork_claude_jsonl, fork_codex_jsonl}` to copy the session file up to the requested turn and launches with `--resume <fork_uuid>` / `codex resume <fork_uuid>`.
       - Cross-provider or general handoff: Stages the complete `handoff.md` into the target terminal's staging directory via `put::stage_terminal`, then injects a brief two-line file-path pointer instructing the agent to read it.
    3. **`--into <target>` Merge-Back Mode (including `merge_back`)**: Extracts conclusions from the source node's recent turns (or the incremental turns since the last fork), builds a lightweight delta handoff, and delivers it safely into an existing `a*` or as a file pointer into an existing `t*` (without clearing or restarting a PTY target).
- **`remote.rs`, `cli.rs`, `cli/output.rs`, `mcp.rs`, `help.txt`, `SKILL.md`**
  - Wired `"agent.handoff"` into the remote forwarding allowlist, the `h2 handoff` CLI subcommand, the `h2_handoff` MCP tool, `lineage` status display, and help/skill documentation.
  - Updated the OpenRPC schema (`schema/h2.openrpc.json`), CLI command docs (`docs/commands.md`), and `tests/handoff.rs` integration tests.

---

### Step 3: Drove DAG Automatic Fallback Retry Handover

- **`drove/protocol.rs` and `drove/pool.rs`**
  - Added `PriorAttemptHandover` and `build_task_prompt_with_handover`.
  - When a DAG task retries (`retry_of`) and is scheduled onto a new worker (or falls back to an alternate provider), `build_attempt_handover` extracts the failure reason, executed trajectory, and trailing output summary from the previous attempt's `WorkerItem` logs and injects them into the prompt, while recording lineage in `Worker.forked_from` and `Assign.fork`.

---

### Step 4: Desktop UI Integration (`herdr-app`)

- **`src/commands.rs`, `src/hc.rs`, `src/window.rs`, `defaults/AGENTS.md`**
  - Registered and forwarded the `agent.handoff` command, and updated `AGENTS.md` command documentation to pass doc validation tests.
- **New `defaults/mods/handoff/{mod.json,main.js}` (bilingual `en` / `zh-CN`)**
  - Provides the Handoff modal with mode selection (`Handoff` / `Fork` / `Side Chat` / `Merge back`), target runtime (`CLI` / `ACP`), Preset, and placement layout (`Split Right` / `New Tab` / `Peek`).
- **Existing Module Integration**
  - `defaults/mods/menu/main.js`: Adds Handoff / Fork / Side Chat / Merge back entries to context and action menus.
  - `defaults/mods/pane/main.js`: Displays a clickable `↳ <source>` lineage badge and hover quick actions in the pane header.
  - `defaults/mods/peek/{acp_model.js,main.js}`: Parses and renders `Entry::Handoff` banner cards along with header lineage jump and `Merge back` actions.

---

## 3. Verification Plan

- **`herdr-core` verification**:
  - `H2_UPDATE_SCHEMA=1 cargo test --locked -p herdr2 --test m0`
  - `sh scripts/docs.sh --write`
  - `cargo clippy --locked --all-targets -- -D warnings`
  - `cargo test --locked -p herdr2 --lib`
  - `cargo test --locked -p herdr2 --test m0 --test cli_docs --test skill --test handoff --test checkpoints --test acp_mcp --test drove`
- **`herdr-app` verification**:
  - `cargo build --locked`
  - `bun scripts/docs.ts generate`
  - `bun test scripts/docs.test.ts scripts/peek.test.ts scripts/changes.test.ts scripts/agents.test.ts scripts/tabs.test.ts scripts/palette.test.ts`
  - `cargo test --locked`
