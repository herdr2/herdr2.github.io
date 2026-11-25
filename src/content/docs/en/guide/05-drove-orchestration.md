---
title: "05. Drove Multi-Agent DAG Orchestration"
description: "One-click desktop role configuration, Plan-first then /drove parallel orchestration, /drove-add hot-appending, review circuit breakers, and the 7 Drove Web visual workbenches."
---
> When a requirement spans multiple modules and calls for coordinated coding, testing, documentation, and heterogeneous review, single-agent serial development quickly hits context limits and blind spots. **Drove** is the native multi-agent DAG orchestration engine built right into `h2`—you don't need to hand-write config files or memorize CLI flags. Just **align on a plan with your main agent as usual, then type `/drove`** to direct a specialized, permission-isolated, self-verifying AI engineering squad working in parallel.

---

## 1. Configure Your Team Once: Desktop Drove Roles

Before using `/drove` for the first time, complete two quick one-time setup steps (under 1 minute total):

1. **Ensure companion Skills are installed**: Verify you have run `h2 skill install --all` (or one-click installed them in **Settings → Skills**) so your primary coding agent (Claude Code / Codex / Antigravity / Cursor / OpenCode, etc.) has the `/drove`, `/drove-add`, and `/drove-setup` skills.
2. **Configure your role roster in Settings → Drove**: Press `Ctrl+,` to open Settings and open the **Drove** section on the left:

![Settings -> Drove roles and multi-candidate configuration page](/images/docs/12-settings-drove.png)

### The Fastest Way to Configure
- **AI One-Click Setup (Strongly Recommended)**: With Global Core AI configured, click **Refresh Agents** at the top to scan locally installed coding CLIs, then click **AI One-Click Setup**—Herdr2 automatically pairs each role with the best-fit agent, model, thinking effort, and specialty tags.
- **Multi-Candidate Failover Chains**: As shown above, you can assign `#1 Primary → #2 Fallback → #3 Fallback` candidates to `coder` (or any role); if a model hits rate limits, runs out of quota, or times out, Drove automatically fails over and retries.
- **Specialty Tags & Routing Notes**: Tag candidate models with strengths (e.g., *"Backend Architecture"*, *"Frontend UI"*, *"Quick Fix"*) or add routing notes (such as avoiding high-cost models during peak hours), and Drove routes tasks accordingly.
- **Built-in Roles & Write-Permission Guardrails**:

| Role ID | Display Name | Write Permission Level | Typical Responsibilities |
| --- | --- | --- | --- |
| `coder` | Coder | `writable` | Core feature implementation, module refactoring, and bug fixes |
| `tester` | Tester | `scoped_write` | Unit/integration test authoring, bug reproduction, and regression verification |
| `writer` | Technical Writer | `writable` | Technical documentation, architecture guides, and diagram explanations |
| `illustrator` | Illustrator | `writable` | Architecture diagrams, flowcharts, sequence diagrams, and SVG vector graphics |
| `reviewer` | Reviewer | `readonly` | Heterogeneous code review, concurrency safety checks, and architectural audits |
| `researcher` | Researcher | `readonly` | Cross-repo source search, architecture discovery, and log analysis |

---

## 2. Everyday Core Workflow: Plan First, Then `/drove`

In day-to-day development, you rarely need to type `h2 drove` commands manually—**treat your main agent as the Coordinator and converse in plain natural language**. The recommended four-step cadence is:

### Step 1: Align on a Plan with Your Main Agent

Open your go-to primary agent in Herdr2 (Claude Code CLI / ACP, Codex, Antigravity, etc.) and discuss the requirement and plan just like you normally do:
- Clarify which modules to touch, how interfaces should look, and what edge cases matter;
- Decide on verification commands (e.g., `cargo test`, `pytest`, `npm run build`) and whether you want documentation or heterogeneous code review;
- **Wait until the plan is agreed upon in chat before kicking off execution**—aligning direction in a single thread is cheap, and a crisp plan keeps parallel agents from drifting and reworking each other's changes.

### Step 2: Launch Parallel Multi-Agent Execution with `/drove`

Once the plan is confirmed, send `/drove` with a brief directive right inside the same conversation:

```text
/drove Split the confirmed plan into tasks and execute in parallel. Isolate core module changes in separate Worktrees, make sure unit tests pass, and assign a heterogeneous model for independent code review.
```

After you send that message, **your main agent takes over the entire orchestration automatically—no manual `plan.yaml` editing or scheduling commands needed**:
1. The main agent decomposes the plan into a task Directed Acyclic Graph (DAG) with dependencies and submits it to the background `h2` Drove engine;
2. Drove spawns real headless ACP sub-agents (`a*`) in the background according to each task's `role` and specialty tags to execute in parallel;
3. Concurrent code-editing tasks automatically receive isolated **Git Worktrees** to prevent file collisions, pass through Verify gates and heterogeneous model reviews upon completion, and merge back into the main branch;
4. If a sub-worker asks a clarifying question, the main agent answers on your behalf whenever possible; for genuine product or architectural trade-offs that need your call, the main agent summarizes the context and asks you right in the main chat.

:::note
**Dead-Loop Protection (Review Circuit Breaker)**: If a task fails code review twice in a row, Drove automatically trips the circuit breaker and escalates the fix directly to your **main agent**, allowing only one final re-review afterward. If disagreements remain after that final check, Drove hard-trips and reports the history of findings along with recommended next steps so you can decide (targeted fix or wrap up)—never burning quota in an endless background loop.
:::

### Step 3: Add Work Mid-Flight with `/drove-add`

A Drove Run is still in progress—or just wrapped up—and you suddenly realize you need one more test, a doc tweak, or a small lint fix?

No need to start a whole new Run. Just send `/drove-add` in the main agent conversation:

```text
/drove-add Also update the corresponding section in the user guide, and have the tester add a regression test for invalid inputs.
```

Drove hot-appends the new tasks into the current Run and **directly reuses warm-idle Workers of the matching role**, skipping cold starts while preserving their loaded context.

### Step 4: Visual Supervision — Desktop Sidebar Tree + Drove Web Canvas

Throughout execution, you have two zero-friction live observation surfaces:
- **Bottom-left Agents Tree in Herdr2 Desktop**: Every Worker (`a*`) spawned by Drove collapses neatly under its parent Coordinator agent, displaying live status and elapsed time; click any sub-worker to **Peek** at the exact files it is reading and the lines it is changing.
- **Drove Web Visual Orchestration Canvas**: Click **Open Drove Web** at the top right of **Settings → Drove** (or open `http://127.0.0.1:7799` directly in your browser) for a bird's-eye view of the entire DAG.

---

## 3. Drove Web Visual Orchestration Workbench

Drove ships with a lightweight, zero-intrusion Web orchestration workbench (listening on `http://127.0.0.1:7799` by default; customize the port via `H2_DROVE_PORT`; when connected to SSH remote hosts, it also aggregates remote `<machine>/<run_id>` runs and forwards live SSE event streams). The Web UI focuses on **observability, diagnostics, and targeted controls (such as pausing/resuming a Run or stopping a misbehaving Worker)**, while keeping core business decisions and replies anchored in your main agent conversation.

### 3.1 Global Chrome & 7 Dedicated Workbench Views

Opening Drove Web presents a three-part fixed layout:
- **Left Run List & Trash**: Switch between all Running and Completed Runs (including remote-host Runs), with support for renaming, drag-and-drop reordering, and moving to Trash (restorable anytime).
- **Top Global Navigation & Overview Bar**:
  - Row 1 holds the **7 dedicated workbench tabs** (with live count badges), plus a top-right bilingual toggle (`中文 / EN`) and theme switcher (`System / Light / Dark`);
  - Row 2 is the **Live Run Overview Strip**: glance at total tasks, dependencies, Workers/Reviewers, active alerts, and the global **Pause / Resume** button;
  - Row 3 provides **dual-row smart filter pills**: on the left, filter by `Needs Review / No Review`, the 6 lifecycle stages (`design` / `core` / `ui` / `verify` / `docs` / `cleanup`), and `Auto-Repairing`; on the right, jump straight to active anomalies (`Review Rejected` / `Verify Failed` / `Task Failed` / `Unanswered Questions`) to pinpoint problem tasks immediately.

| Tab | Role | When to Open It |
| --- | --- | --- |
| **Graph** | Live global DAG topology canvas | Get a bird's-eye view of squad assignments, upstream/downstream dependencies, and current bottlenecks |
| **Coordinator** | Master architect workbench | Track global token/cost budget progress, host interaction stream, message threads, and stall diagnostics |
| **Tasks** | Task spec & verification workbench | Inspect a single task's acceptance criteria, AI-compressed summary / full report, Verify logs, and AI deep diagnostics |
| **Workers** | Live execution fleet workbench | Monitor each Worker's model, context usage, write-permission boundaries, and live tool-call stream |
| **Reviews** | Heterogeneous code review view | Compare author vs. independent reviewer models, round-by-round review timelines, code diffs, and circuit-breaker state |
| **Daemon** | Daemon & control-plane audit console | Check Daemon health, control-plane AI connectivity, 7 policy switches, separate AI billing, and the live event stream |
| **Roles** | Role routing matrix & profiles | Audit `Architect` and specialist permission boundaries, candidate model chains, specialty tags, and historical success-rate profiles |

---

### 3.2 Graph: Live DAG Topology Canvas

In **Graph**, both the orchestration fleet and the task pipeline share a single zoomable canvas:

![Drove Web live DAG orchestration canvas](/images/docs/15-drove-web-dag.png)

Key highlights and interaction tips:
- **Three functional zones**:
  - **Left Orchestration & Execution Fleet Zone**: Anchored on the far left by the single global **Architect · Coordinator** node, fanning out rightward to role-grouped Worker fleets (Coders, Testers, Technical Writers, Researchers, etc.);
  - **Bottom-Left Independent Read-Only Review Zone**: Groups independent read-only reviewers (`R#`) running in read-only sandboxes, visually separated from authors;
  - **Right Task Pipeline Zone**: Arranges all task cards by topological layer, showing each task's live sub-stage (`Coding` / `Verifying` / `Reviewing R 1/2` / `Reworking` / `Merging`) and resource consumption.
- **Reading the bottom edge legend**:
  - `Gray arrow` = upstream incomplete, downstream waiting; `Green arrow` = upstream complete and unblocked; `Dashed data branch` = depends on upstream task outputs;
  - `Blue dashed line` = dispatched by Coordinator; `Fork dashed line` = context inheritance (`--fork`); `Execution edge` / `Review edge` link specific Workers and Reviewers to tasks.
- **High-frequency interactions**:
  - Top toolbar supports **Horizontal / Vertical** orientation toggles, **Re-layout**, and visibility toggles for `Workers`, `Reviewers`, `Execution edges`, and `Review edges`;
  - Click any Worker or task node to highlight its connected upstream/downstream chain and open a quick-inspect drawer; click a stage pill to spotlight only nodes in that stage;
  - When an issue occurs, a red **`! Action Needed`** alert bar appears above the canvas—click any item to jump straight to the failing source.

---

### 3.3 Coordinator Workbench: Budgets, Comms & Stall Diagnostics

Switch to **Coordinator** to monitor overall Run health from the orchestrator's perspective:

![Drove Web Coordinator workbench](/images/docs/17-drove-web-coordinator.png)

- **Left Budget & Pending Panel**: Top progress bars track the current Run's **token usage and estimated cost** against budget caps (separating Worker spend from control-plane AI spend); the bottom **Pending Items** queue aggregates all failed reviews, failed verifications, failed tasks, and unanswered questions.
- **Four switchable sub-views**:
  1. **Host Interaction Stream**: Replays the main agent's session log; toggle **Full Details** in the top right (off by default to hide verbose tool calls and surface only key human-agent decisions, or expand on demand for deep inspection);
  2. **Orchestration Comms**: Threads together all Worker questions, Coordinator replies, and system escalations;
  3. **Stall & Pending Diagnostics**: Automatically flags zero-progress stalls and long-unanswered blockers;
  4. **Final Verification & Config**: Inspects the Run goal, concurrency cap, final Verify status, and Auto-Repair turn consumption.

---

### 3.4 Tasks Workbench: Spec, Verify Logs & AI Deep Diagnostics

Click any task card on the canvas, or switch to the top **Tasks** tab, to enter the per-task inspection and troubleshooting view:

![Drove Web Tasks detail workbench](/images/docs/16-drove-web-tasks.png)

- **Left Status-Filtered List**: Quickly filter by `All` / `Running` / `Pending` / `Completed` / `Failed & Blocked`; each card displays its stage, assigned Worker (`W#`), tokens, and cost.
- **Right Structured Details**:
  - **Five-Part Spec**: Clearly presents the task's `Goal`, `Changes`, `Constraints`, `Ownership`, and `Acceptance` criteria;
  - **Dual Result View**: Defaults to **Compact Summary (AI Compressed)** so you grasp the outcome in 3 seconds, with a one-click **Full Report** toggle for the raw delivery write-up;
  - **Topology Dependencies, Branches & Rules**: Lists Worktree isolation policy, upstream dependencies, and all downstream cascading tasks;
  - **Attempt History & Troubleshooting**: Scroll down to inspect each Attempt's execution trace and **raw Verify gate logs**. If a task fails, click **AI Deep Diagnose** to pinpoint root causes, or click **Locate in Graph** at the top right to jump back to its position in the DAG.

---

### 3.5 Workers Workbench: Live Fleet Status & Permission Guardrails

Switch to **Workers** to monitor every sub-agent like a live production line:

![Drove Web Workers workbench](/images/docs/18-drove-web-workers.png)

- **Two-Dimensional Filters**: Filter on the left by both status/identity (`All / Active / Ended / Author (W#) / Reviewer (R#)`) and specific role (`Coder / Tester / Technical Writer / Reviewer / Researcher`); a progress bar at the bottom of each card shows that Worker's context-window utilization percentage.
- **Runtime & Permission Transparency**: The right-hand **Runtime & Context** card shows the bound agent, model, thinking effort, cumulative tokens, Attempt count, working directory, and—most importantly—the **Allowed Write Scope** (explicitly stating whether it is *"Standard workspace read/write (bounded by task ownership)"* or *"Read-only snapshot view (sandboxed read-only isolation)"*).
- **Associated Tasks & Live Interaction Stream**: The upper-right section lists all tasks handled by this Worker along with its **context fingerprint** (code domain tags + key files); below, switch between **Orchestration Comms / Attempts / Interaction Stream** (streaming every reasoning step and tool call live). If an active Worker goes off the rails, click **Stop** directly to cut losses immediately.

---

### 3.6 Reviews Tab: Closed-Loop Heterogeneous Cross-Review

Switch to **Reviews** to supervise every critical task gated by independent code review:

![Drove Web Reviews page](/images/docs/19-drove-web-reviews.png)

- **Clear Review Scoping**: The left list separates tasks into **NEEDS REVIEW** (filterable by `All / Reviewing · Reworking / Passed / Failed · Error / Pending`) and **NO REVIEW**, with at-a-glance status pills.
- **Author vs. Reviewer Side-by-Side Comparison**: The right side places the **Author (`W#`)** and **Reviewer (`R#` independent read-only review)** cards next to each other so you can verify **heterogeneous models** at a glance (for example, `antigravity · gemini-4-carbon` authoring and `codex · gpt-6.1-sol` reviewing with a green `Heterogeneous Review` badge), alongside the read-only snapshot directory, submission and rework counts, review criteria, and current round (e.g., `Round 1/2`).
- **Complete Review Timeline & Diffs**: Below, switch between **Review Loop Timeline (Process & Diff)** and **Reviewer Session Stream** to trace each round's candidate submission, reviewer Findings list, code diff slices, rework commits, and any **Review Circuit Breaker** handoffs to the Coordinator and final re-review records.

---

### 3.7 Daemon Control Plane & Role Routing Matrix

Switch to **Daemon** and **Roles** to inspect every runtime detail of the scheduling engine and control-plane AI:

![Drove Web Daemon control plane](/images/docs/20-drove-web-daemon.png)

- **Four-Panel Daemon Control Plane**:
  1. **Daemon Process Status**: Real-time monitoring of the background daemon PID, version, and uptime;
  2. **Control-Plane AI Assist**: Shows the active Core AI model, thinking effort, endpoint URL, key source, and **circuit-breaker state (Closed Healthy / Open Cooling Down)**, with an on-demand **Test Connection** button;
  3. **7 Control-Plane AI Policy Switches**: Inspect active policies for `Verify Failure Summary`, `Handoff Context Compression`, `Auto Run Naming`, `Task Semantic Enrichment`, `Write-Conflict Policy (e.g., warn / auto_worktree)`, `Question Triage Mode (draft)`, and `Loop Detection (steer_once)`;
  4. **Current Run Control-Plane AI Usage**: Tracks control-plane AI calls, cache-hit tokens, and cost separately so they never mix with Worker coding spend.
- **Live Control-Plane Workflow Event Stream**: Chronologically logs every AI decision, gate verdict, write-conflict check, Worktree integration, and review circuit-breaker event—filterable by scope (`Current Run / Global`), category (`AI Capability / Gate Verdict / Scheduling Conflict`), and status (`OK / Warning / Degraded / Failed`), with direct jump links to the associated `Task`, `Worker`, or `Message`.
- **Roles Tab (Role Routing Matrix)**: Summarizes the single host `Architect` and every specialist role's permission boundaries, default thinking effort, primary/fallback model chains, specialty tags, and historical metrics (success rate, average duration, retry rate) to help you continuously tune your squad.

:::tip
**Explore the Entire UI Risk-Free First**: Want to tour all 7 Drove Web workbenches before launching a real multi-agent run? Open `http://127.0.0.1:7799/?mock=1` in your browser to load built-in **demo data** (indicated by a green `Demo Data` badge in the top right)—Graph, Coordinator, Tasks, Workers, Reviews, Daemon, and Roles are all fully interactive!
:::

---

## 4. Under the Hood: Drove's Four Engineering Safeguards

To see everything `/drove` orchestrates behind the scenes, here is the end-to-end architecture diagram:

![Drove multi-agent DAG orchestration and gate loop](/images/docs/diagram-drove-dag-workflow.svg)

Four core safeguards:
1. **Role Permission Guardrails**: Each role carries an explicit write-permission level (`writable`, `scoped_write`, `readonly`), enforced down to the OS sandbox layer (Linux `bwrap` / macOS `sandbox-exec` / Windows Restricted Token) to prevent out-of-bounds writes.
2. **Multi-Candidate Failover (Fallback)**: Configure an ordered chain of candidate models per role so rate limits, quota exhaustion, or timeouts fail over automatically.
3. **Git Worktree Concurrency Isolation & Merging**: Parallel write tasks execute in isolated Worktree branches with automatic pre-flight Git health checks, then merge cleanly back after passing verification and review—eliminating file collisions for good.
4. **Heterogeneous Adversarial Review**: A model distinct from the author serves as an independent read-only reviewer, paired with the three-stage Review Circuit Breaker to eliminate self-review blind spots without risking infinite rework loops.

---

## 5. Appendix: Common `h2 drove` CLI Quick Reference (Troubleshooting & Scripting)

> In normal daily use, your main agent invokes these commands automatically behind `/drove` and `/drove-add`—**you don't need to type them by hand**. Keep this reference handy for pure-SSH troubleshooting, manually recovering a stalled Run, or scripting automation.

```bash
h2 drove ls                         # List all Runs
h2 drove show                       # Show tasks, circuit-breaker state, and warm Workers for the current Run
h2 drove web                        # Open or print the Drove Web URL
h2 drove inspect <task_key_or_id>   # Inspect detailed execution and review history for a task
h2 drove pause <run_id>             # Pause execution
h2 drove resume <run_id>            # Resume execution
h2 drove retry <task_key_or_id>     # Manually retry a failed task
h2 drove cancel <run_id>            # Cancel an entire Run
```

---

**Previous**: [← 04. Global Core AI, Prompt Polish, Handoff & Checkpoints](/en/guide/04-handoff-checkpoints-and-ai/) | **Next**: [06. Remote Hosts, Deep Customization & Automated QA →](/en/guide/06-remote-customization-and-qa/)
