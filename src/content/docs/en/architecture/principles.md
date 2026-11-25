---
title: "Herdr2 Architecture and Implementation Deep Dive"
description: "An in-depth look at Herdr2's dual-plane hybrid runtime, binary multiplexing protocol, headless ACP engine, and cross-machine federation engineering."
---

This document provides a comprehensive engineering breakdown of **Herdr2** (`herdr-core/crates/herdr2` + `herdr-app`), covering its design decisions, Core dual-plane state machine, headless ACP engine, Ghostty/PTY human workspace recovery, cross-machine federation, and the Linux → Windows cross-compilation pipeline.

---

## 1. Overall Layered Architecture: Dual-Plane Isolation (PTY Workspace + Headless ACP Sub-Agents)

During Herdr2's architectural evolution, a pure-headless prototype replaced the desktop UI entirely with fixed chat panels and removed interactive terminals—making it impossible to open a shell or run interactive CLIs directly in the workspace. The finalized **Herdr2 Hybrid Architecture** establishes two cleanly separated planes within a single daemon and desktop framework:

1. **Human Workspace Plane (PTY/ConPTY + `libghostty-vt`)**: Serves interactive terminals, shells, and interactive CLIs (addressed as `t1`, `t2`, ...). Each terminal runs inside a persistent `holder` subprocess, while the desktop client renders hardware-accelerated text grids and full keyboard/mouse encoding via `ghostty-sys`.
2. **Background Sub-Agent Plane (Headless ACP over stdio NDJSON)**: Serves autonomous collaborative sub-agents spawned by a primary agent or human terminal (addressed as `a1`, `a2`, ...). They allocate no PTY/ConPTY, expose no terminal or filesystem capabilities, open no popups or screen panes, and are driven over strongly typed JSON-RPC 2.0 with a built-in MCP feedback loop.

![Herdr2 Overall Layered Architecture: Dual-Plane Hybrid Runtime](/images/docs/herdr2-architecture.svg)

---

## 2. Core Dual-Plane Runtime (`herdr-core/crates/herdr2`)

### 2.1 Unified Addressing Key and Separate Registries (`runtime.rs`, `runtime/pty.rs`)

To allow the same state machine, wait queues, event subscriptions, parent-child notifications, and cross-machine federation to operate uniformly without cross-contamination, Core enforces explicit type-level isolation:

- **`TargetKey::{Agent(u32), Terminal(u32)}` (`runtime.rs`)**: Parses `a*` and `t*` addresses as a unified index key across `waiting`, `notes`, notification queues, and `die_with_parent` mappings.
- **Dual Registry Persistence**:
  - `State.reg` (`agents.json`) + `transcripts/<addr>.jsonl`: Persists all headless ACP agent records and structured conversation histories.
  - `State.pty_reg` (`terminals.json`) + `holder` process links (`Link`): Persists interactive workspace terminals, `screens` (server-side `ghostty_vt::Terminal` mirrors), and window state.
- **Strict API Separation and Name Deduplication**:
  - `api/pty.rs` serves `terminal.*` (14 methods: `terminal.run`, `terminal.list`, `terminal.get`, `terminal.kill`, `terminal.rm`, `terminal.keep`, `terminal.label`, `terminal.read`, `terminal.attach`, `terminal.send`, `terminal.wait`, `terminal.keys`, `terminal.interrupt`, `terminal.put`).
  - `api/run.rs` and `api.rs` serve `agent.*`.
  - Neither registry allows claiming a `--name` alias currently held by a live (`is_live()`) entry in the other registry within the same session, keeping `h2 get <name>` and `h2 read <name>` unambiguous.
  - When `agent.{rm,read,send,interrupt,put}` receives unified CLI addresses or legacy frontend requests, it resolves the `TargetKey` via `resolve_any` and dispatches accurately to either the `agent` or `pty` handler; meanwhile, `terminal.list` and `agent.list` remain strictly isolated and never leak into one another.

### 2.2 Binary Multiplexing Protocol and Flow Control (`wire.rs`, `viewers.rs`)

Clients connect to Core over a Unix Domain Socket (`$XDG_RUNTIME_DIR/herdr2/<session>.sock`), Windows Named Pipe, or SSH stdio. The handshake begins as plaintext NDJSON; once `"hello"` includes `framed: true` and Core acknowledges it (`server.rs`), the connection switches to a **9-byte little-endian binary framing protocol** (`wire::HEADER = 9`, `MAX_PAYLOAD = 16 MiB`):

```text
 0       1       2       3   4   5       6       7       8   9 ... 9+len
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+-------+
|      channel (u32 LE)     | k |       len (u32 LE)        | payload   |
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+-------+
                              ^
                              kind: 0=DATA, 1=CREDIT, 2=CLOSE, 3=RESIZE,
                                    4=FOCUS, 5=FACTS, 6=AUTOMATIC_INPUT
```

- **Channel `0` (JSON-RPC 2.0 Control Channel)**: Carries RPC requests and responses with a backlog ceiling of `MAX_CONTROL = 64 MiB`.
- **Channel `N > 0` (Event Streams and Live Terminal Screen Views)**:
  - `events.subscribe` allocates a dedicated channel broadcasting `agents` / `terminals` state snapshots and incremental deltas, ACP `transcript` entries, and `doc` update notifications. Memory is bounded by a 256 KiB sliding credit window (`CREDIT`) and a `MAX_PENDING = 4 MiB` `missed` resync mechanism.
  - `terminal.attach` (used by both desktop panes and CLI `h2 attach`) uses an independent channel for bidirectional VT output snapshots/byte streams, viewport size changes (`RESIZE`), focus synchronization (`FOCUS`), theme/font metrics (`FACTS`), and automatic terminal response suppression (`AUTOMATIC_INPUT`). When multiple clients view the same terminal simultaneously, `foreground.rs` and `viewers.rs` arbitrate foreground dimensions so a smaller background window does not steal viewport resolution.

### 2.3 Workspace PTY and Environment Setup (`api/pty.rs`, `holder.rs`, `runtime/pty.rs`)

Whenever the desktop client creates a Space, Tab, or Split:
1. `terminal_env` injects `H2_TERMINAL_ID=t*`, `H2_TERMINAL_SOCKET=<socket>`, an isolation scope token (`sweep::VAR`), and the initial working directory `PWD`.
2. `pty_child_env` strips `IDENTITY_VARS` (`H2_AGENT_ID`, `H2_AGENT_SOCKET`, `H2_TERMINAL_ID`, `H2_TERMINAL_SOCKET`), re-injects the terminal identity, and sets `TERM=xterm-256color`, `COLORTERM=truecolor`, and `TERM_PROGRAM=ghostty`.
3. A framed spawn request (`holder_proto::SPAWN`) instructs the resident `holder` subprocess to spawn a PTY/ConPTY (on Windows, backed by bundled `programs/h2/conpty/{conpty.dll, x64/OpenConsole.exe}`). All raw terminal output streams back into the server-side `ghostty_vt::Terminal` (tracking cursor, title, state, and snapshots) and fans out to all subscribed frontends.

### 2.4 Headless ACP Engine and Strict Capability Masking (`acp/*`, `api/run.rs`)

Calls through `h2 run`, the built-in `h2_run` MCP tool, or `agent.run` follow a completely separate ACP path:

1. **Zero-Terminal Process Environment (`api/run.rs`)**: `child_env` strips any `TERMINAL_VARS` inherited from the host shell (`TERM`, `COLORTERM`, `TERM_PROGRAM`, `TERM_PROGRAM_VERSION`) along with `H2_TERMINAL_*`, retaining only the runtime identity variables `H2_AGENT_ID`, `H2_AGENT_SOCKET`, and `H2_SESSION`.
2. **Protocol Handshake Masking and Capability Negotiation (`acp/proto.rs`)**: Sends `InitializeParams::herdr2()` explicitly declaring `ClientCapabilities::headless()`:
   - `fs: { readTextFile: false, writeTextFile: false }`, `terminal: false` (strictly terminal-free).
   - `session.configOptions.boolean: {}`: Declares support for real-time boolean and enum configuration negotiation with compatible adapters (such as `model`, `reasoning_effort` / `thought_level`, `fast-mode`, `mode`, and `collaboration_mode`), while retaining legacy `models` / `modes` fallback parsing and live `agent.config` / `h2 config` overrides (synchronized via `"config"` subscription events and reapplied during `--keep` `session/load`; `agent.list` stays compact while `agent.get` and `"config"` events carry the full `config_options`).
3. **Three-Task Async Transport (`acp/transport.rs`)**: Uses asynchronous piped stdin/stdout/stderr with `HANDSHAKE_TIMEOUT = 30s`, retains the last `64` lines of `stderr` (up to `512` bytes per line) for precise handshake failure diagnostics, and attaches a platform `AgentGuard` to prevent orphaned child processes.
4. **Automatic Built-In MCP Injection and Schema Fallback (`acp/mod.rs`)**: When `inject_mcp` is enabled, `session/new` and `session/load` automatically inject `{ type: "stdio", name: "herdr2", command: <self_exe>, args: ["mcp"], env: ... }`. If an older adapter rejects the payload with `-32602`, Core automatically strips `"type"` and retries. Model selection prefers `session/set_config_option` and falls back to `session/set_model` on `-32601`.

### 2.5 Serial Inbox, `--steer` Preemption, Transcripts, and Permission Arbitration

- **Serial Inbox State Machine (`acp/mod.rs`)**: Each ACP session uses a single actor to consume queued prompts (`QueuedPrompt`). Only one `session/prompt` executes at a time per session, eliminating concurrent out-of-order turns. Passing `--steer` inserts the new prompt at the head of the queue and sends `SessionCommand::Steer` → ACP `session/cancel` to stop the current turn at a clean boundary before immediately popping and running the front item.
- **Strongly Typed 8-Kind Transcript (`transcript.rs`)**: Defines `Entry::{User, Thought, Assistant, ToolCall, Plan, Permission, Error, Stderr}` (bounded in memory by `MAX_ENTRIES = 2000` / `MAX_BYTES = 2 MiB` and persisted to disk as JSONL), pushed in real time over `events.subscribe`.
- **Permission State Machine (`permissions.rs`)**: `PermissionMode` supports `ApproveAll`, `ApproveReads` (default: automatically approves read-only operations such as `read`/`search`/`think`/`fetch`/`list`/`glob`/`grep`, while suspending write/exec requests in the `blocked` state and exposing `PendingPermission` options to upstream `approve`/`deny`), `DenyAll`, and `Ask`.

### 2.6 Hybrid Parent-Child Orchestration (`mcp.rs`, `notes.rs`, `api/waiting.rs`)

- **Adaptive Caller Identity Detection (`mcp.rs:148` & `api/run.rs`)**: Both `h2 mcp` and the `h2` CLI use `client::agent_id().or_else(client::terminal_id)` to detect automatically whether the caller is a background ACP agent (`a*`) or a desktop human workspace terminal (`t*`).
- **Hybrid Parent-Child Trees and Notification Delivery (`notes.rs`)**:
  - `a*` → `a*`: Child status notifications are queued directly into the parent agent's inbox wrapped in an `<h2 from="...">` envelope.
  - `t*` → `a*`: When a headless sub-agent spawned by a human workspace terminal hits a permission block, error, or exit, notifications are safely pasted into the parent terminal via `pty_input` (respecting `notes_quiet` quiet-window delays and `draft_wait` input-draft backoff, or immediately waking an active `h2 wait --children` invocation).
  - Closing desktop terminal pane `t*` triggers `Job::Orphaned(TargetKey::Terminal(id))`, automatically cleaning up all descendant ACP sub-agents not marked `--outlive-parent`.

---

## 3. Native Desktop Client (`herdr2` App / `herdr-app`) Implementation

### 3.1 `ghostty-sys` + GPUI Hardware-Accelerated Workspace Views

While renamed to **`herdr2` (`0.2.0`)** with full side-by-side isolation, `herdr-app` preserves the battle-tested native desktop experience:

- **`crates/ghostty-sys` and `src/vt.rs`**: Statically links `libghostty-vt` with `bindgen`-generated FFI bindings. Each frontend `TerminalView` maintains a local `libghostty-vt` state machine synchronized with Core (consuming Channel N incremental screen bytes and resize feedback), while GPUI handles ligatures, adaptive color contrast (`minimum_contrast`), smooth scrolling, and keyboard/mouse encoding.
- **Unified Entry Points and Full-Permission Launches (`defaults/mods/new-menu/main.js`, `defaults/programs.json`, `src/window.rs`)**: The `+` menu keeps **`Terminal`** alongside automatic path discovery for dozens of preconfigured local CLIs. Built-in coding agents (`claude`, `codex`, `opencode`, `cursor`, `copilot`, `amp`, `agy`, `kimi`, `kiro`, `hermes`, `qoder`, `crush`, `gemini`, etc.) launch with full-permission flags inside real PTYs via `Core::run` (`terminal.run`). On Windows, `powershell_argv` / `agent_argv` automatically include `-ExecutionPolicy Bypass` so `.ps1` shims execute cleanly, and `programs.rs` detects both generic PowerShell wrappers and `shell_child_seen` transitions so `agent: false` is restored accurately once the child CLI exits back to the shell prompt.
- **Dual-Channel `Agents` Sidebar, Non-7501 State Inference, and Synchronized Cleanup (`src/hc.rs`, `src/terminal.rs`, `src/window.rs`, `defaults/mods/agents/main.js`, `defaults/mods/peek/main.js`)**:
  1. **Dual Event Consumption**: `EventLines` consumes both `"terminals"` and `"agents"` snapshots and incremental events from `events.subscribe` (including `status`, `pending_permission`, `inbox_len`, `transcript`, and `labels`) and normalizes cross-machine `parent` addresses uniformly across both planes.
  2. **Non-OSC-7501 State Machine**: `OSC 7501` (`reported == true`) retains top priority. When an interactive agent does not emit `7501` and `program.agent == true`, `TerminalView::inferred_agent_state` + `infer_pty_agent_state` inspects, in order: raw title indicators/spinners (`raw_title` preserves pre-stripped glyphs) → live PTY output activity (`last_output_at`, filtering attach replays and short keystroke echoes) → trailing interactive approval prompts (`Vt::tail_lines(6)`), updating working/blocked/idle state every `tend_terminals` tick (≤500 ms) and driving the unfocused `done` state.
  3. **Headless ACP Integration, T3 Code Conversation Overlay, Live Capability Bar, and Workspace Tab Mounting**: `window.rs` routes headless `a*` addresses via `is_acp_addr` (pin/seen writes to `agent.label`, kill writes to `agent.kill`, state/config changes flow through `hc.rs::EventLines`). Clicking an ACP row invokes `terminal.peek` to open a large frameless conversation overlay (`width: 0.86`, `height: 0.88`, `frame: "none"`). Running `terminal.keep` or clicking `↗ Open as Tab` persists `Content::Mod { mod: "peek", props: { acp: true, tab: true, terminal } }` into the Space's shared Tab tree via `layout.rs` (`Node::acp_terminal` / `Node::any_terminal`), `mirror.rs` (cross-machine prefix mapping), `model.rs` (`any_address_of` / `acp_pane_of`), and `window.rs`, simultaneously closing the overlay and deduplicating `headless_agents`. Calling `terminal.park` or clicking `↙ Background` (or the tab context menu's `"Detach to background"`) unmounts the tab while keeping the background session alive. On the frontend, `defaults/mods/peek/acp_model.js` and `defaults/mods/peek/main.js` call `h2 read --json <agent>` and `h2 get --json <agent>` to render work logs, Markdown code cards, inline `pending_permission` approval controls, the `TextareaState` composer bar, and a bottom capability strip with live search/custom-value dropdowns and toggles (backed by `h2 config --json`). Hovering parent or child rows in the `Agents` sidebar reveals an `✕` remove button (`pane.close` or `terminal.kill`); `space.close` matches owned ACP sessions via `space_folders` with multi-space deduplication, and `kill()` filters `closing_terminals` alongside immediate `publish_terminals` / `sync` for same-frame visual and process teardown.
- **Core Connection and Shared Layout (`src/hc.rs`, `src/mirror_sync.rs`, `src/control.rs`)**: The desktop client connects to the daemon via `$LOCALAPPDATA/Programs/h2/h2.exe` or `~/.local/bin/h2`, persists the Space/Tab/Pane layout tree under Core document key `"herdr2-app"`, and serves `herdr2 ls/status/do/shot` control commands over `$HERDR2_APP_HOME/herdr2-app.sock` (`HERDR2_APP_HOME` defaults to `~/.config/herdr2-app`).

---

## 4. Key Engineering Breakthroughs in Linux → Windows Cross-Compilation

Native Windows `x86_64-pc-windows-msvc` release builds—combining Rust, Direct3D 11, QuickJS, Zig 0.16, and `libghostty-vt` (mixed C/C++/Zig compilation)—are cross-compiled directly from a Linux / WSL2 host:

1. **Explicit MSVC `--libc` Forwarding for Zig `translate-c`**:
   - `cargo-xwin` mounts the MSVC CRT (`crt/include`, `crt/lib/x86_64`) and Windows SDK UCRT/UM (`sdk/include/ucrt`, `sdk/lib/{ucrt,um}/x86_64`) under `~/.cache/cargo-xwin/xwin/`.
   - In Ghostty's `pkg/wuffs/build.zig`, when `target.os.tag == .windows` enables `.link_libc = true`, standard Zig `Compile` steps inherit `zig build --libc <file>`, but upstream `translate_c.init` failed to forward `b.libc_file` to the `translate-c` child step (causing `'stdlib.h' not found`). Patching `vendor/ghostty/pkg/wuffs/build.zig` in both repositories to forward `.libc_file = if (b.libc_file) |p| .{ .direct = .{ .cwd_relative = p } } else .detect_darwin,` allows `simdutf`, `highway`, `wuffs_c`, and `ghostty-vt` to compile and link cleanly on the first pass under `-Dcpu=baseline`.
2. **GPUI Direct3D 11 Runtime HLSL Compilation (`vendor/gpui-pre-windows`)**:
   - Release builds bypass native Windows `fxc.exe` by injecting the `gpui_runtime_d3dcompile` cfg flag in `build.rs`. At startup, GPUI invokes Windows's built-in `D3DCompile` (`d3dcompiler_47.dll`, `D3DCOMPILE_OPTIMIZATION_LEVEL3`) in memory to compile embedded HLSL shaders on the fly.
3. **Bundled ConPTY Runtime and Process Guard**:
   - Compatible `conpty.dll` and `x64/OpenConsole.exe` binaries are bundled under `Programs/h2/conpty/`, ensuring `powershell.exe` and other interactive terminals spawn reliably across Windows 10/11 regardless of the system ConPTY version while injecting `H2_TERMINAL_ID` into child processes.

---

## 5. Side-by-Side Isolation Matrix

| Isolation Boundary | Original Herdr | Herdr2 |
|---|---|---|
| Core binary & CLI name | `herdr-core` / `hc` | `herdr2` / `h2` (Windows includes `h2.exe` & `herdr2-core.exe`) |
| Desktop binary & window title | `herdr-app` / `"Herdr"` | `herdr2` (includes `herdr2-app.exe`) / `"Herdr2"` |
| Core version negotiation prefix | `"hc "` | `"h2 "` |
| Core environment variable prefix | `HC_*` (`HC_SESSION`, `HC_AGENT_ID`, `HC_TERMINAL_ID`, `HC_SOCKET`) | `H2_*` (`H2_SESSION`, `H2_AGENT_ID`, `H2_TERMINAL_ID`, `H2_SOCKET`) |
| App environment variable prefix | `HERDR_APP_HOME`, `HERDR_TEST_WINDOW`, `HERDR_TELEMETRY` | `HERDR2_APP_HOME`, `HERDR2_TEST_WINDOW`, `HERDR2_APP_ID`, `HERDR2_TELEMETRY` |
| Local control socket | `~/.config/herdr-app/herdr-app.sock` | `~/.config/herdr2-app/herdr2-app.sock` |
| Core layout sync document key | `"herdr-app"` | `"herdr2-app"` |
| Core runtime state directory | `~/.local/state/herdr-core/` / `%LOCALAPPDATA%\herdr-core\` | `~/.local/state/herdr2/` / `%LOCALAPPDATA%\herdr2\` |
