---
title: "CLI Command Reference"
description: "Complete CLI command and flag reference generated from the h2 / herdr2 binary."
---
Generated from the built binary's help. Do not edit by hand.
Run `just docs` to refresh it and `just docs-check` to check it.

[Start here](https://github.com/herdr2/herdr2) for a short tour.

## h2

```text
h2 - hybrid PTY workspace & headless ACP multi-agent runtime

Usage: h2 <command> [options]
       h2               list live agents and terminals

Agents & terminals
  run [--agent A] [--prompt P] [argv|template [task]]
                              start a headless ACP sub-agent (--bg: don't wait)
  ls                          list live terminals and ACP agents (--all: finished too)
  get <a|t>                   show one agent's or terminal's full record
  read <a|t> [--last|--lines N]
                              print rendered transcript (ACP) or screen/history (PTY)
  attach <t>                  follow a live PTY terminal in the shell (Ctrl-\ then d)
  keys <t> <key>...           send named keys (enter, esc, ctrl+c, ...) to a PTY terminal
  kill <a|t>                  terminate an ACP agent or PTY terminal
  rm <a|t>                    remove a finished agent or terminal
  label <a|t> k=v...          set or clear labels (`k=` clears)
  keep <a|t> [--off]          resume crashed/restarted agent or shell

Communicate & control
  send <a|t> [--image F] [--resource F] [--resource-link U] [text]
                              queue ACP prompt/media or paste into PTY (--steer: cancel & deliver next)
  inbox ls|edit|rm <a> ...    inspect, edit, or remove prompts queued in an ACP inbox
  approve <a> [--option ID]   approve a blocked ACP agent's pending permission request
  deny <a> [--option ID]      deny a blocked ACP agent's pending permission request
  config <a> --id K (--value V|--bool B)
                              set live ACP model, reasoning effort, fast mode, or session mode
  interrupt <a|t>             send ACP `session/cancel` or PTY interrupt (Esc / Ctrl-C)
  wait <a|t>                  wait until not `working` (--output X, --children any|all)
  put <a|t> <file>            stage a file beside agent or terminal, print path
  handoff <a|t> [--kind K] [--preset P] [--pty] [--into T] [--prompt TEXT]
                              hand off, fork, or merge session context across agents
  checkpoint ls|snap|diff|rollback <a|t>
                              hidden Git ref snapshots, pure turn diffs, and dual rollback

Non-agent & files
  exec [--on m] <cmd>         run non-agent command directly; exact stdout/stderr & exit code
  file read|write|edit [--on m] <path>
                              read, atomic-write from stdin, or exact-edit files

More
  templates                   list templates (~/.config/herdr2/templates)
  mcp                         run built-in stdio MCP server (`h2 mcp`)
  events                      follow ordered lifecycle events as JSON lines
  server start|stop|status|restart
                              manage background runtime daemon
  update [--version X|--from <file>]
                              update h2 binary and restart core cleanly
  machine add|ls|login|update|rename|rm
                              manage remote machines over SSH or `--via`
  connect                     JSON-RPC API over stdin/stdout
  drove status|web|probe|...  manage Drove DAG orchestration and Web UI
  skill status|install|ai-install
                              detect coding agents and install bundled Herdr2 skills
  ai status|settings-set|test manage shared Core AI assistant & cache stats
  schema                      print OpenRPC 1.3.2 JSON Schema

<a> / <t> is an agent (`a1`), terminal (`t1`), remote (`machine/a7`), or unique name.
Built-in `--agent` presets: agy, claude, codex, cursor, dsh, gemini, opencode, copilot, kimi, qwen, pi, hermes, glm, zcode.
Options: --json (default when piped except read/file read/exec), -V --version, --licenses.
Per command: h2 <command> --help
Settings: ~/.config/herdr2/config.toml (default_permissions, inject_mcp, [agents]).
Agent manual: h2 --skill
```

## h2 ai

```text
Inspect or configure the shared Core AI assistant (`ai status`, `ai settings-set`, `ai test`)

Usage: h2 ai [OPTIONS] <COMMAND>

Commands:
  status             Show shared Core AI assistant status, configuration, and KV-cache metrics
  settings-set       Update shared Core AI assistant settings from a JSON file
  models             Fetch available models from an OpenAI-compatible AI endpoint (/models)
  test               Test the shared Core AI assistant URL and API key
  probe-prompt-mode  Clear prior prompt-cache detection records, set prompt mode to auto, and re-detect shared-prefix vs compact mode
  handoff-recommend  Recommend a complementary target provider, handoff mode, and note for an upstream session
  briefing           Aggregate local & remote agents and Drove runs into a priority catch-up briefing
  summarize-agent    Generate or refresh a concise semantic title and progress micro-summary for an agent or terminal
  commit-message     Generate a concise Git commit message for uncommitted changes using Core AI
  polish-prompt      Polish a rough user prompt into a clearer, more structured prompt for an ACP or CLI agent
  help               Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 ai briefing

```text
Aggregate local & remote agents and Drove runs into a priority catch-up briefing

Usage: h2 ai briefing [OPTIONS]

Options:
      --json                         JSON output even in a terminal
      --on <ON>                      Target remote machine (`h2 machine ls`)
      --lang <LANG>                  Preferred language (`zh-CN` / `en`)
      --away-minutes <AWAY_MINUTES>  Away duration in minutes (optional context for executive headline)
      --no-ai                        Return deterministic aggregation only without calling Core AI
  -h, --help                         Print help
```

## h2 ai commit-message

```text
Generate a concise Git commit message for uncommitted changes using Core AI

Usage: h2 ai commit-message [OPTIONS]

Options:
      --cwd <CWD>    Git repository directory (defaults to current working directory)
      --json         JSON output even in a terminal
      --on <ON>      Target remote machine (`h2 machine ls`)
      --lang <LANG>  Preferred language (`zh-CN` / `en`)
      --no-ai        Return deterministic fallback without calling Core AI
  -h, --help         Print help
```

## h2 ai handoff-recommend

```text
Recommend a complementary target provider, handoff mode, and note for an upstream session

Usage: h2 ai handoff-recommend [OPTIONS] <SOURCE>

Arguments:
  <SOURCE>  Source agent or terminal (`a1`, `t1`, name, or `machine/a1`)

Options:
      --installed <INSTALLED>  Installed presets available on the target machine (repeatable or comma-separated)
      --json                   JSON output even in a terminal
      --lang <LANG>            Caller UI language (`zh` / `en`)
  -h, --help                   Print help
```

## h2 ai models

```text
Fetch available models from an OpenAI-compatible AI endpoint (/models)

Usage: h2 ai models [OPTIONS]

Options:
      --file <FILE>   
      --json          JSON output even in a terminal
      --url <URL>     
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
      --consume       Delete `--file` right after reading it
  -h, --help          Print help
```

## h2 ai polish-prompt

```text
Polish a rough user prompt into a clearer, more structured prompt for an ACP or CLI agent

Usage: h2 ai polish-prompt [OPTIONS] <PROMPT>

Arguments:
  <PROMPT>  Draft prompt text to polish

Options:
      --json               JSON output even in a terminal
      --target <TARGET>    Optional target agent or terminal (`a1`, `t1`, name, or `machine/a1`)
      --kind <KIND>        Target agent kind (`acp` or `cli`)
      --context <CONTEXT>  Optional extra context hint (workspace or task summary)
      --lang <LANG>        Preferred language (`zh-CN` / `en`)
      --on <ON>            Target remote machine (`h2 machine ls`)
  -h, --help               Print help
```

## h2 ai probe-prompt-mode

```text
Clear prior prompt-cache detection records, set prompt mode to auto, and re-detect shared-prefix vs compact mode

Usage: h2 ai probe-prompt-mode [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 ai settings-set

```text
Update shared Core AI assistant settings from a JSON file

Usage: h2 ai settings-set [OPTIONS] --file <FILE>

Options:
      --file <FILE>   
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
      --consume       Delete the input JSON file right after reading it (safe for API keys)
  -h, --help          Print help
```

## h2 ai status

```text
Show shared Core AI assistant status, configuration, and KV-cache metrics

Usage: h2 ai status [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 ai summarize-agent

```text
Generate or refresh a concise semantic title and progress micro-summary for an agent or terminal

Usage: h2 ai summarize-agent [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Target agent or terminal (`a1`, `t1`, name, or `machine/a1`)

Options:
      --json         JSON output even in a terminal
      --lang <LANG>  Preferred language (`zh-CN` / `en`)
      --no-ai        Return deterministic summary only without calling Core AI
  -h, --help         Print help
```

## h2 ai test

```text
Test the shared Core AI assistant URL and API key

Usage: h2 ai test [OPTIONS]

Options:
      --file <FILE>    
      --json           JSON output even in a terminal
      --url <URL>      
      --model <MODEL>  
      --on <MACHINE>   Target remote machine (`h2 machine ls`)
      --consume        Delete `--file` right after reading it
  -h, --help           Print help
```

## h2 approve

```text
Approve a blocked agent's pending ACP permission request

Usage: h2 approve [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json             JSON output even in a terminal
      --option <OPTION>  Explicit ACP permission `optionId` to choose (default: first matching option)
  -h, --help             Print help
```

## h2 attach

```text
Follow live output of an interactive PTY terminal (Ctrl-\ then d detaches)

Usage: h2 attach [OPTIONS] [TERMINAL]

Arguments:
  [TERMINAL]  The terminal: `t7`, a name, or `machine/t7`

Options:
      --json               JSON output even in a terminal
      --observe            Watch only: never type or resize
      --history <HISTORY>  Scrollback lines to show first (main screen only) [default: 0]
  -h, --help               Print help
```

## h2 checkpoint

```text
Hidden Git ref checkpoints, pure turn diffs, and session/workspace rollback (`ls`, `snap`, `diff`, `rollback`)

Usage: h2 checkpoint [OPTIONS] <COMMAND>

Commands:
  ls        List hidden Git ref checkpoints and workspace isolation state
  snap      Manually capture a checkpoint for an agent or terminal (defaults to current pane/agent)
  diff      Show the pure authored diff between two checkpoints
  rollback  Roll back session state (and optionally workspace files) to an earlier turn
  bisect    Locate which checkpoint turn most likely introduced a bug or regression
  help      Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 checkpoint bisect

```text
Locate which checkpoint turn most likely introduced a bug or regression

Usage: h2 checkpoint bisect [OPTIONS] --query <QUERY> <TARGET>

Arguments:
  <TARGET>  Agent (`a1`), terminal (`t1`), remote (`machine/t1`), or unique name

Options:
      --json           JSON output even in a terminal
      --query <QUERY>  Symptom or regression query (e.g. "which turn broke auth tests?")
      --lang <LANG>    Caller UI language (`zh` / `en`)
  -h, --help           Print help
```

## h2 checkpoint diff

```text
Show the pure authored diff between two checkpoints

Usage: h2 checkpoint diff [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Agent (`a1`), terminal (`t1`), remote (`machine/t1`), or unique name

Options:
      --from <FROM>  Starting checkpoint turn (defaults to highest snapshot before `to`)
      --json         JSON output even in a terminal
      --to <TO>      Ending checkpoint turn (defaults to latest checkpoint)
  -h, --help         Print help
```

## h2 checkpoint ls

```text
List hidden Git ref checkpoints and workspace isolation state

Usage: h2 checkpoint ls [OPTIONS] <TARGET>

Arguments:
  <TARGET>  Agent (`a1`), terminal (`t1`), remote (`machine/t1`), or unique name

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 checkpoint rollback

```text
Roll back session state (and optionally workspace files) to an earlier turn

Usage: h2 checkpoint rollback [OPTIONS] --to <TO> <TARGET>

Arguments:
  <TARGET>  Agent (`a1`), terminal (`t1`), remote (`machine/t1`), or unique name

Options:
      --json      JSON output even in a terminal
      --to <TO>   Target checkpoint turn (`0` = baseline before turn 1)
      --no-files  Rewind conversation memory only; keep current workspace files intact
      --confirm   Confirm destructive file restore on a main checkout or with co-located idle shells
  -h, --help      Print help
```

## h2 checkpoint snap

```text
Manually capture a checkpoint for an agent or terminal (defaults to current pane/agent)

Usage: h2 checkpoint snap [OPTIONS] [TARGET]

Arguments:
  [TARGET]  Agent (`a1`), terminal (`t1`), remote (`machine/t1`), or unique name

Options:
      --json           JSON output even in a terminal
      --label <LABEL>  Optional bookmark label recorded alongside this checkpoint
  -h, --help           Print help
```

## h2 config

```text
Configure a live ACP session option (model, reasoning effort, fast mode, session mode)

Usage: h2 config [OPTIONS] --id <ID> <AGENT>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`

Options:
      --id <ID>        Option id to set (e.g. `model`, `reasoning_effort`, `fast-mode`, `mode`)
      --json           JSON output even in a terminal
      --value <VALUE>  String option value (for select options such as model, reasoning effort, or mode)
      --bool <BOOL>    Boolean option value (`true` or `false`, e.g. for `fast-mode`) [possible values: true, false]
  -h, --help           Print help
```

## h2 connect

```text
Speak the protocol over stdin/stdout (`ssh box herdr2 connect`)

Usage: h2 connect [OPTIONS]

Options:
      --json               JSON output even in a terminal
      --session <SESSION>  The h2 session to reach, like H2_SESSION (one command that reads the same in sh, cmd and PowerShell)
  -h, --help               Print help
```

## h2 deny

```text
Deny a blocked agent's pending ACP permission request

Usage: h2 deny [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json             JSON output even in a terminal
      --option <OPTION>  Explicit ACP permission `optionId` to choose (default: first matching option)
  -h, --help             Print help
```

## h2 drove

```text
Manage multi-agent Drove orchestration (`drove status`, `drove web`, `drove settings`, ...)

Usage: h2 drove [OPTIONS] [COMMAND]

Commands:
  status           Show Drove web server, configured roles, AI status, and active runs
  web              Print or open the Drove Web UI URL in the browser
  runs             List Drove runs (read-only) [alias: ls]
  roles            Show configured Drove roles, models, and routing policy (read-only)
  settings         Read Drove configuration, resolved roles, and AI connection status
  settings-set     Update Drove configuration from a JSON file (removes temp file if requested)
  probe            Probe installed ACP agents and discover their live model & effort options
  ai-test          Test the lightweight AI assistant URL and API key
  roles-ai-config  Use the configured AI assistant model to auto-configure Drove roles, models, candidate strengths, and routing notes
  magpie-test      Test the optional Magpie quota gateway
  use              Set the active default Run ID for subsequent CLI commands
  plan             Create a Drove Run from a YAML/JSON plan file or stdin and launch its DAG
  add              Append one or more tasks to an existing Run
  quick            Quickly launch a single-task Run from the command line
  wait             Wait for pending coordinator messages, task failures, or Run completion
  inbox            List unread coordinator inbox messages for a Run
  show             Inspect a Run, Task, or Message snapshot by ID
  ack              Acknowledge a coordinator inbox message
  reply            Reply to a worker question or escalation message
  send             Send guidance to a running task worker (or interrupt current turn)
  inspect          Inspect structured diagnostics and recent items for a task or attempt
  retry            Retry a task with optional hint or new role/agent/model
  route            Override role/agent/model/effort assignment on a pending or ready task
  cancel           Cancel a specific task (by ID/key) or an entire Run
  complete         Finalize a Run (runs Run-level verify gate if configured)
  pause            Pause scheduling new tasks in a Run
  resume           Resume a paused Run
  worker           Worker protocol subcommands invoked by spawned worker ACP sessions
  install          Install Drove agent skills (`drove`, `drove-add`, `drove-setup`)
  help             Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 drove ack

```text
Acknowledge a coordinator inbox message

Usage: h2 drove ack [OPTIONS] <MESSAGE_ID>

Arguments:
  <MESSAGE_ID>  

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove add

```text
Append one or more tasks to an existing Run

Usage: h2 drove add [OPTIONS]

Options:
      --json             JSON output even in a terminal
      --run <RUN>        Run ID (defaults to `drove use` or latest active run)
      --file <FILE>      
      --stdin            
      --key <KEY>        
      --title <TITLE>    
      --change <CHANGE>  
      --role <ROLE>      
      --deps <DEPS>      
      --verify <VERIFY>  
      --worktree         
      --on <MACHINE>     
  -h, --help             Print help
```

## h2 drove ai-test

```text
Test the lightweight AI assistant URL and API key

Usage: h2 drove ai-test [OPTIONS]

Options:
      --file <FILE>    
      --json           JSON output even in a terminal
      --url <URL>      
      --model <MODEL>  
      --on <MACHINE>   
      --consume        Delete `--file` right after reading it
  -h, --help           Print help
```

## h2 drove cancel

```text
Cancel a specific task (by ID/key) or an entire Run

Usage: h2 drove cancel [OPTIONS] [TARGET]

Arguments:
  [TARGET]  

Options:
      --json          JSON output even in a terminal
      --run <RUN>     
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove complete

```text
Finalize a Run (runs Run-level verify gate if configured)

Usage: h2 drove complete [OPTIONS] [RUN]

Arguments:
  [RUN]  Run ID (positional or via `--run`)

Options:
      --json               JSON output even in a terminal
      --run <RUN>          Run ID (equivalent to positional `<RUN>`)
      --summary <SUMMARY>  
      --force              
      --on <MACHINE>       
  -h, --help               Print help
```

## h2 drove inbox

```text
List unread coordinator inbox messages for a Run

Usage: h2 drove inbox [OPTIONS] [RUN]

Arguments:
  [RUN]  Run ID (positional or via `--run`)

Options:
      --json          JSON output even in a terminal
      --run <RUN>     Run ID (equivalent to positional `<RUN>`)
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove inspect

```text
Inspect structured diagnostics and recent items for a task or attempt

Usage: h2 drove inspect [OPTIONS] <TARGET>

Arguments:
  <TARGET>  

Options:
      --json          JSON output even in a terminal
      --run <RUN>     
      --tail <TAIL>   Number of recent transcript items to return (1..=200, default 30) [default: 30]
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove install

```text
Install Drove agent skills (`drove`, `drove-add`, `drove-setup`)

Usage: h2 drove install [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --target <DIR>  
  -h, --help          Print help
```

## h2 drove magpie-test

```text
Test the optional Magpie quota gateway

Usage: h2 drove magpie-test [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --url <URL>     
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove pause

```text
Pause scheduling new tasks in a Run

Usage: h2 drove pause [OPTIONS] [RUN]

Arguments:
  [RUN]  Run ID (positional or via `--run`)

Options:
      --json          JSON output even in a terminal
      --run <RUN>     Run ID (equivalent to positional `<RUN>`)
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove plan

```text
Create a Drove Run from a YAML/JSON plan file or stdin and launch its DAG

Usage: h2 drove plan [OPTIONS]

Options:
      --file <FILE>
          Plan YAML or JSON file (`{ objective?, maxConcurrency?, verify?, tasks: [...] }` or task list)
      --json
          JSON output even in a terminal
      --stdin
          Read plan YAML/JSON from stdin
      --objective <OBJECTIVE>
          Run objective (defaults to plan `objective` or directory name)
      --cwd <CWD>
          Workspace root (defaults to current working directory)
      --max-concurrency <MAX_CONCURRENCY>
          Maximum parallel workers (1..16)
      --verify <VERIFY>
          Run-level verification command executed on `complete`
      --session <SESSION>
          Override coordinator session address (defaults to `$H2_AGENT_ID` or `$H2_TERMINAL_ID`)
      --on <MACHINE>
          
  -h, --help
          Print help
```

## h2 drove probe

```text
Probe installed ACP agents and discover their live model & effort options

Usage: h2 drove probe [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  
      --refresh       Run live ACP initialize+session/new probing instead of quick cache/PATH scan
  -h, --help          Print help
```

## h2 drove quick

```text
Quickly launch a single-task Run from the command line

Usage: h2 drove quick [OPTIONS] <PROMPT>

Arguments:
  <PROMPT>  

Options:
      --json             JSON output even in a terminal
      --role <ROLE>      [default: coder]
      --cwd <CWD>        
      --verify <VERIFY>  
      --worktree         
      --wait             
      --on <MACHINE>     
  -h, --help             Print help
```

## h2 drove reply

```text
Reply to a worker question or escalation message

Usage: h2 drove reply [OPTIONS] <MESSAGE_ID> <BODY>

Arguments:
  <MESSAGE_ID>  
  <BODY>        

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove resume

```text
Resume a paused Run

Usage: h2 drove resume [OPTIONS] [RUN]

Arguments:
  [RUN]  Run ID (positional or via `--run`)

Options:
      --json          JSON output even in a terminal
      --run <RUN>     Run ID (equivalent to positional `<RUN>`)
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove retry

```text
Retry a task with optional hint or new role/agent/model

Usage: h2 drove retry [OPTIONS] <TASK>

Arguments:
  <TASK>  

Options:
      --hint <HINT>
          
      --json
          JSON output even in a terminal
      --role <ROLE>
          
      --agent <AGENT>
          
      --model <MODEL>
          
      --effort <EFFORT>
          
      --review-agent <REVIEW_AGENT>
          
      --review-model <REVIEW_MODEL>
          
      --no-review
          
      --fresh
          
      --user-override
          Explicit user-approved override to bypass a tripped review hard circuit breaker (`awaiting_user_decision`)
      --override-reason <OVERRIDE_REASON>
          Optional audit note explaining the user's decision when passing `--user-override`
      --run <RUN>
          
      --on <MACHINE>
          
  -h, --help
          Print help
```

## h2 drove roles

```text
Show configured Drove roles, models, and routing policy (read-only)

Usage: h2 drove roles [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 drove roles-ai-config

```text
Use the configured AI assistant model to auto-configure Drove roles, models, candidate strengths, and routing notes

Usage: h2 drove roles-ai-config [OPTIONS]

Options:
      --file <FILE>                
      --json                       JSON output even in a terminal
      --mode <MODE>                Configuration scope: `models`, `strengths`, `notes`, or `all`
      --instruction <INSTRUCTION>  Optional preference instruction for how roles should be assigned
      --apply                      Explicitly confirm applying the AI-generated role configuration to drove.json
      --dry-run                    Preview without saving to drove.json
      --language <LANGUAGE>        Preferred language for strength tags and rationale (e.g. zh-CN or en)
      --on <MACHINE>               
      --consume                    Delete `--file` right after reading it
  -h, --help                       Print help
```

## h2 drove route

```text
Override role/agent/model/effort assignment on a pending or ready task

Usage: h2 drove route [OPTIONS] <TASK>

Arguments:
  <TASK>  

Options:
      --json             JSON output even in a terminal
      --role <ROLE>      
      --agent <AGENT>    
      --model <MODEL>    
      --effort <EFFORT>  
      --worker <WORKER>  
      --run <RUN>        
      --on <MACHINE>     
  -h, --help             Print help
```

## h2 drove runs

```text
List Drove runs (read-only)

Usage: h2 drove runs [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --trash         List trashed runs instead of active/completed runs
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 drove send

```text
Send guidance to a running task worker (or interrupt current turn)

Usage: h2 drove send [OPTIONS] <TASK> <TEXT>

Arguments:
  <TASK>  
  <TEXT>  

Options:
      --interrupt     
      --json          JSON output even in a terminal
      --run <RUN>     
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove settings

```text
Read Drove configuration, resolved roles, and AI connection status

Usage: h2 drove settings [OPTIONS]

Options:
      --json               JSON output even in a terminal
      --section <SECTION>  Return only a specific section (`roles`, `agents`, `ai`, `magpie`, `config`)
      --compact            Return a compact summary without full probed model lists
      --on <MACHINE>       
  -h, --help               Print help
```

## h2 drove settings-set

```text
Update Drove configuration from a JSON file (removes temp file if requested)

Usage: h2 drove settings-set [OPTIONS] --file <FILE>

Options:
      --file <FILE>   
      --json          JSON output even in a terminal
      --on <MACHINE>  
      --consume       Delete the input JSON file right after reading it (safe for API keys)
  -h, --help          Print help
```

## h2 drove show

```text
Inspect a Run, Task, or Message snapshot by ID

Usage: h2 drove show [OPTIONS] [ID]

Arguments:
  [ID]  Run ID, Task ID (`tsk_...`), or Message ID (`msg_...`)

Options:
      --json          JSON output even in a terminal
      --run <RUN>     Run ID (equivalent to positional `<RUN_ID>`)
      --full          Include full task spec (`change`, `acceptance`, `constraints`) instead of compact summaries
      --on <MACHINE>  
  -h, --help          Print help
```

## h2 drove status

```text
Show Drove web server, configured roles, AI status, and active runs

Usage: h2 drove status [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 drove use

```text
Set the active default Run ID for subsequent CLI commands

Usage: h2 drove use [OPTIONS] <RUN_ID>

Arguments:
  <RUN_ID>  

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 drove wait

```text
Wait for pending coordinator messages, task failures, or Run completion

Usage: h2 drove wait [OPTIONS] [RUN]

Arguments:
  [RUN]  Run ID (positional or via `--run`)

Options:
      --json                   JSON output even in a terminal
      --run <RUN>              Run ID (equivalent to positional `<RUN>`)
      --timeout <TIMEOUT>      [default: 300]
      --since-seq <SINCE_SEQ>  [default: 0]
      --on-task-done           Return as soon as any additional task reaches a terminal state (not only full Run settlement) [alias: --on-change]
      --full                   Return full task specs instead of compact task summaries
      --on <MACHINE>           
  -h, --help                   Print help
```

## h2 drove web

```text
Print or open the Drove Web UI URL in the browser

Usage: h2 drove web [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --run <RUN>     Pre-select a run ID (`run_...` or `machine/run_...`)
      --on <MACHINE>  Target remote machine
      --no-open       Print URL only without launching a browser
  -h, --help          Print help
```

## h2 drove worker

```text
Worker protocol subcommands invoked by spawned worker ACP sessions

Usage: h2 drove worker [OPTIONS] <COMMAND>

Commands:
  context  Print current worker & active attempt context from the daemon
  inbox    Drain unread notes sent to this worker attempt
  ask      Ask the coordinator a blocking question and print the reply
  note     Post a non-blocking progress note to the coordinator
  read     Read a dependency task result, verify log, or review patch slice
  done     Submit task attempt completion or explicit failure to the Drove daemon gates
  help     Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 drove worker ask

```text
Ask the coordinator a blocking question and print the reply

Usage: h2 drove worker ask [OPTIONS] <QUESTION>

Arguments:
  <QUESTION>  

Options:
      --json                   JSON output even in a terminal
      --options <OPTIONS>      
      --recommend <RECOMMEND>  
      --why <WHY>              
      --timeout <TIMEOUT>      [default: 300]
      --attempt <ATTEMPT>      Optional explicit attempt ID (defaults to worker's live active attempt)
  -h, --help                   Print help
```

## h2 drove worker context

```text
Print current worker & active attempt context from the daemon

Usage: h2 drove worker context [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 drove worker done

```text
Submit task attempt completion or explicit failure to the Drove daemon gates

Usage: h2 drove worker done [OPTIONS]

Options:
      --json               JSON output even in a terminal
      --outcome <OUTCOME>  [default: done]
      --summary <SUMMARY>  
      --reason <REASON>    
      --data <DATA>        
      --files <FILES>      
      --no-retry           
      --attempt <ATTEMPT>  Optional explicit attempt ID (defaults to worker's live active attempt)
  -h, --help               Print help
```

## h2 drove worker inbox

```text
Drain unread notes sent to this worker attempt

Usage: h2 drove worker inbox [OPTIONS]

Options:
      --attempt <ATTEMPT>  Optional explicit attempt ID (defaults to worker's live active attempt)
      --json               JSON output even in a terminal
  -h, --help               Print help
```

## h2 drove worker note

```text
Post a non-blocking progress note to the coordinator

Usage: h2 drove worker note [OPTIONS] <TEXT>

Arguments:
  <TEXT>  

Options:
      --json               JSON output even in a terminal
      --subject <SUBJECT>  
      --attempt <ATTEMPT>  Optional explicit attempt ID (defaults to worker's live active attempt)
  -h, --help               Print help
```

## h2 drove worker read

```text
Read a dependency task result, verify log, or review patch slice

Usage: h2 drove worker read [OPTIONS] <TARGET>

Arguments:
  <TARGET>  

Options:
      --json               JSON output even in a terminal
      --offset <OFFSET>    [default: 0]
      --limit <LIMIT>      [default: 65536]
      --grep <GREP>        
      --attempt <ATTEMPT>  Optional explicit attempt ID (defaults to worker's live active attempt)
  -h, --help               Print help
```

## h2 events

```text
Follow fact changes as they happen (one JSON line each when piped)

Usage: h2 events [OPTIONS]

Options:
      --agent <AGENT>              Only this agent
      --json                       JSON output even in a terminal
      --terminal <TERMINAL>        Only this terminal
      --children-of <CHILDREN_OF>  Only children of this agent or terminal
      --label <K=V>                Only records carrying all of these labels (repeatable)
      --doc <NAME>                 Documents by name (repeatable); a name ending in `*` is a prefix. Naming narrows, so documents alone hear only them — name an agent or terminal for both
  -h, --help                       Print help
```

## h2 exec

```text
Run a non-agent command, here or on a machine: exact stdout/stderr and exit code

Usage: h2 exec [OPTIONS] <ARGV>...

Arguments:
  <ARGV>...  Program and arguments, run as given (no shell)

Options:
      --json               JSON output even in a terminal
      --on <MACHINE>       Run it on another machine (see `h2 machine ls`)
      --cwd <CWD>          Working directory (default: where h2 runs; through the API, the core's; with --on, that machine's home)
      --env <K=V>          Set on top of the core's environment, key=value (repeatable)
      --timeout <TIMEOUT>  Seconds before it and everything it started are ended (default 60, at most 600)
  -i, --stdin              Feed what is piped into h2 to its stdin
  -h, --help               Print help
```

## h2 file

```text
Read, write or edit a file here or on a machine

Usage: h2 file [OPTIONS] <COMMAND>

Commands:
  read   Print a text file, or lines of it (--offset, --limit)
  write  Write what is piped in as the file, making missing folders
  edit   Replace exact text found once (--old X --new Y, repeatable); all or none
  help   Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 file edit

```text
Replace exact text found once (--old X --new Y, repeatable); all or none

Usage: h2 file edit [OPTIONS] --old <OLD> --new <NEW> <PATH>

Arguments:
  <PATH>  The file: absolute, or from `cwd`

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  On another machine (see `h2 machine ls`)
      --cwd <CWD>     Where a relative path starts (default: where h2 runs; through the API, the core's; with --on, that machine's home)
      --old <OLD>     Exact text found once in the file (repeatable, paired with --new in order)
      --new <NEW>     What replaces it
  -h, --help          Print help
```

## h2 file read

```text
Print a text file, or lines of it (--offset, --limit)

Usage: h2 file read [OPTIONS] <PATH>

Arguments:
  <PATH>  The file: absolute, or from `cwd`

Options:
      --json             JSON output even in a terminal
      --on <MACHINE>     On another machine (see `h2 machine ls`)
      --cwd <CWD>        Where a relative path starts (default: where h2 runs; through the API, the core's; with --on, that machine's home)
      --offset <OFFSET>  The first line to give, from 1
      --limit <LIMIT>    At most this many lines (default: all, up to 8 MB)
  -h, --help             Print help
```

## h2 file write

```text
Write what is piped in as the file, making missing folders

Usage: h2 file write [OPTIONS] <PATH>

Arguments:
  <PATH>  The file: absolute, or from `cwd`

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  On another machine (see `h2 machine ls`)
      --cwd <CWD>     Where a relative path starts (default: where h2 runs; through the API, the core's; with --on, that machine's home)
  -h, --help          Print help
```

## h2 get

```text
Show one agent

Usage: h2 get [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 handoff

```text
Hand off, fork, open a side chat, or merge back context across ACP/PTY agents

Usage: h2 handoff [OPTIONS] <SOURCE> [ARGV]...

Arguments:
  <SOURCE>
          Source agent or terminal (`a1`, `t1`, name, or `machine/a1`)

  [ARGV]...
          Explicit target command/arguments when spawning with `--pty` (or custom ACP command)

Options:
      --json
          JSON output even in a terminal

      --kind <KIND>
          Lineage kind (`handoff`, `fork`, or `side-chat`)

          Possible values:
          - handoff:      Continue the same line of work in a new or different agent/provider
          - fork:         Branch off to explore or re-implement independently from a turn/state
          - side-chat:    Open a temporary side-channel discussion without replacing the main session
          - send-context: Forward recent session context directly into another currently live session
          
          [default: handoff]

      --preset <AGENT>
          Target preset/program (`claude`, `codex`, `gemini`, `agy`, ...)

      --pty
          Launch an interactive PTY terminal (`t*`) target instead of headless ACP (`a*`)

      --into <TARGET>
          Deliver delta/summary into an existing agent or terminal instead of creating a new one

      --from-turn <FROM_TURN>
          First turn from the source transcript to include (1-based, inclusive)

      --to-turn <TO_TURN>
          Last turn from the source transcript to include (1-based, inclusive)

      --recent-turns <N>
          Include only the most recent N turns from the source transcript (ignored when `from_turn` is set; 0 = all)

      --max-bytes <BYTES>
          Maximum byte budget for the generated handoff package (defaults to 24 KiB)

      --prompt <TEXT>
          Optional initial instruction sent after staging handoff context

      --note <TEXT>
          Short user note included in the generated handoff package header

      --cwd <CWD>
          Working directory override (defaults to source agent/terminal cwd)

      --name <NAME>
          Optional unique name for the newly spawned target

      --model <MODEL>
          Model override for newly spawned ACP or PTY agent targets

      --effort <EFFORT>
          Reasoning effort override (`low`, `medium`, `high`, `xhigh`, `max`) for newly spawned targets

      --keep
          Keep newly spawned target alive across restarts (`--keep`)

      --worktree
          When `kind == fork`, create an isolated Git worktree on its own branch (carrying uncommitted changes) so the forked session can commit freely

      --merge-worktree
          When merging back (`--into`), instruct the target/parent agent to merge code from the source session's fork worktree branch into the main workspace without deleting the worktree or branch

      --raw
          Skip semantic memory distillation / merge-back takeaway compression and send raw bounded turns

      --wait
          With `--prompt`: wait for the first turn on the target to finish

      --timeout <TIMEOUT>
          With `--wait`: seconds before returning early (default: config, else 180)

      --cols <COLS>
          Initial columns when spawning a PTY target (`--pty`)

      --rows <ROWS>
          Initial rows when spawning a PTY target (`--pty`)

  -h, --help
          Print help (see a summary with '-h')
```

## h2 inbox

```text
Inspect, edit, or remove prompts queued in an ACP agent's serial inbox

Usage: h2 inbox [OPTIONS] <COMMAND>

Commands:
  ls            List queued prompts waiting in an agent's inbox
  edit          Edit a queued prompt before its turn begins
  rm            Remove a queued prompt before its turn begins
  send          Interrupt the active turn if needed and immediately send a queued prompt
  resume        Re-enqueue paused prompts preserved across a restart/reboot and resume delivery
  clear-paused  Discard paused prompts preserved across a restart/reboot
  help          Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox clear-paused

```text
Discard paused prompts preserved across a restart/reboot

Usage: h2 inbox clear-paused [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox edit

```text
Edit a queued prompt before its turn begins

Usage: h2 inbox edit [OPTIONS] <AGENT> <ID> <TEXT>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`
  <ID>     Queued inbox item id (`inbox[].id` from `h2 get`)
  <TEXT>   Replacement prompt text

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox ls

```text
List queued prompts waiting in an agent's inbox

Usage: h2 inbox ls [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox resume

```text
Re-enqueue paused prompts preserved across a restart/reboot and resume delivery

Usage: h2 inbox resume [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox rm

```text
Remove a queued prompt before its turn begins

Usage: h2 inbox rm [OPTIONS] <AGENT> <ID>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`
  <ID>     Queued inbox item id (`inbox[].id` from `h2 get`)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 inbox send

```text
Interrupt the active turn if needed and immediately send a queued prompt

Usage: h2 inbox send [OPTIONS] <AGENT> <ID>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`
  <ID>     Queued inbox item id (`inbox[].id` from `h2 get`)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 interrupt

```text
Send ACP `session/cancel` to stop the current turn cleanly

Usage: h2 interrupt [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json               JSON output even in a terminal
      --timeout <TIMEOUT>  Seconds to wait for cancellation effect (default 10)
  -h, --help               Print help
```

## h2 keep

```text
Keep a live agent recoverable via `session/load` (--off disables)

Usage: h2 keep [OPTIONS] <AGENT>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
      --off   Keep this live agent recoverable across crash or planned restart
  -h, --help  Print help
```

## h2 keys

```text
Send named keys (enter, esc, tab, ctrl+c, ...) to a live PTY terminal

Usage: h2 keys [OPTIONS] <TERMINAL> <KEYS>...

Arguments:
  <TERMINAL>  The terminal: `t7`, a name, or `machine/t7`
  <KEYS>...   Key names: enter, esc, tab, up, ctrl+c, alt+x, f5, a, ...

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 kill

```text
End an agent process (HUP, then escalate)

Usage: h2 kill [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 label

```text
Set labels (key=value; key= removes)

Usage: h2 label [OPTIONS] <AGENT> <K=V>...

Arguments:
  <AGENT>   The agent: `a7`, a name, or `machine/a7`
  <K=V>...  Labels to set, key=value; `key=` removes one

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 ls

```text
List live agents

Usage: h2 ls [OPTIONS]

Options:
      --all          Include finished agents
      --json         JSON output even in a terminal
      --label <K=V>  Only agents carrying all of these labels (repeatable)
  -h, --help         Print help
```

## h2 machine

```text
Other machines, reached over ssh

Usage: h2 machine [OPTIONS] <COMMAND>

Commands:
  add     Add a machine you reach with ssh: h2 machine add vps
  ls      List the machines added here
  login   Log in again (a password or code) after the machine says it needs one. On Windows: reconnect once its SSH keys work
  update  Copy this h2 there and restart h2 there
  rename  Give a machine a new name here
  rm      Forget a machine (its agents keep running there)
  help    Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 machine add

```text
Add a machine you reach with ssh: h2 machine add vps

Usage: h2 machine add [OPTIONS] [TARGET]

Arguments:
  [TARGET]  How ssh reaches it: `vps`, `can@10.0.0.7`, `can@10.0.0.7:2222`, a Host from ~/.ssh/config

Options:
      --json               JSON output even in a terminal
      --via <COMMAND>      Reach it with this command instead of ssh: it is given a shell line to run there as its last argument, like ssh (`ssh -p 2222 -i key user@ip`, `fly ssh console -a app --pty=false -C`)
      --temp               Mark it short-lived (a sandbox for a task), so clients can show it apart from machines that stay. h2 treats it like any other; remove it with `h2 machine rm`
      --install            Copy this h2 there when it has none or one too old, without asking
      --name <NAME>        What to call it here (default: the target's host)
      --session <SESSION>  The h2 session on that machine (default: its default)
  -h, --help               Print help
```

## h2 machine login

```text
Log in again (a password or code) after the machine says it needs one. On Windows: reconnect once its SSH keys work

Usage: h2 machine login [OPTIONS] <MACHINE>

Arguments:
  <MACHINE>  The machine's name

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 machine ls

```text
List the machines added here

Usage: h2 machine ls [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 machine rename

```text
Give a machine a new name here

Usage: h2 machine rename [OPTIONS] <MACHINE> <NEW_NAME>

Arguments:
  <MACHINE>   The machine's name now
  <NEW_NAME>  Its new name. Addresses with the old one stop working

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 machine rm

```text
Forget a machine (its agents keep running there)

Usage: h2 machine rm [OPTIONS] <MACHINE>

Arguments:
  <MACHINE>  The machine's name

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 machine update

```text
Copy this h2 there and restart h2 there

Usage: h2 machine update [OPTIONS] <MACHINE>

Arguments:
  <MACHINE>  The machine's name

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 mcp

```text
Run the built-in stdio MCP server (`h2 mcp`)

Usage: h2 mcp [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 put

```text
Stage a local file beside a live agent (on its machine); prints its path

Usage: h2 put [OPTIONS] <AGENT> <FILE>

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`
  <FILE>   The file's name, kept so `.png` stays `.png` (CLI: the local file to send)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 read

```text
Print an agent's transcript or final assistant text (`--last`)

Usage: h2 read [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json                   JSON output even in a terminal
      --lines <LINES>          Trailing rendered transcript lines (default: full transcript)
      --last                   Print only the final assistant text from the latest turn
      --wait                   Wait for the agent to finish its current turn or block before reading
      --timeout <TIMEOUT>      With `--wait`: seconds before returning early (default: config, else 180)
      --from-turn <FROM_TURN>  First turn to include when slicing transcript entries (1-based, inclusive)
      --to-turn <TO_TURN>      Last turn to include when slicing transcript entries (1-based, inclusive)
  -h, --help                   Print help
```

## h2 rm

```text
Remove a finished agent

Usage: h2 rm [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent: `a7`, a name, or `machine/a7`

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 run

```text
Start an ACP agent preset, command, or template: `h2 run claude "fix tests"`

Usage: h2 run [OPTIONS] [ARGV]...

Arguments:
  [ARGV]...  Preset/command and arguments, or a template name and its task

Options:
      --agent <AGENT>                 ACP preset name (`claude`, `codex`, `gemini`, ...) or explicit command line
      --json                          JSON output even in a terminal
      --prompt <TEXT>                 Initial prompt queued right after ACP session setup
      --system-prompt <TEXT>          System prompt appended via `_meta.systemPrompt` on session creation
      --model <MODEL>                 Model override passed to `session/set_config_option` (`model`)
      --effort <EFFORT>               Reasoning effort override passed to `session/set_config_option` (`reasoning_effort` / `thought_level`)
      --mode <MODE>                   Session mode override passed to `session/set_mode`
      --permissions <MODE>            Permission policy (`approve-all`, `approve-reads`, `deny-all`, `ask`, `dangerously-skip-permissions`) [possible values: approve-all, approve-reads, deny-all, ask]
      --dangerously-skip-permissions  Skip all permission checks (`approve-all` policy plus `bypassPermissions` session mode when supported)
      --no-mcp                        Disable injecting the built-in `herdr2` MCP server into `mcpServers`
      --name <NAME>                   Name, unique among live agents: 1-32 of a-z 0-9 - _ 
      --cwd <CWD>                     Working directory (default: where h2 runs; through the API, the core's; with --on, that machine's home)
      --on <MACHINE>                  Run it on another machine (see `h2 machine ls`); its address is `machine/a7`
      --label <K=V>                   Labels, key=value (repeatable)
      --parent <PARENT>               Parent agent (default: the agent it is started from)
      --no-parent                     No parent, even when started from an agent
      --no-notify                     Don't send automated notes about it to its parent
      --outlive-parent                Keep it running when its parent finishes (by default it ends too)
      --rm                            Remove it right after it exits (once a waiting parent has seen it)
      --keep                          Keep recovering via `session/load` (if supported) after crash or restart
      --bg                            Start it and return immediately
      --timeout <TIMEOUT>             Seconds before a wait checks in, leaving it running (default: config `wait_timeout`, else 180)
  -h, --help                          Print help
```

## h2 schema

```text
Every API method with its JSON Schema, for app builders

Usage: h2 schema [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 send

```text
Queue a prompt into an agent's ACP inbox (or --steer to cancel & deliver next)

Usage: h2 send [OPTIONS] <AGENT> [TEXT]

Arguments:
  <AGENT>  The agent: `a7`, a name, or `machine/a7`
  [TEXT]   Prompt text queued for the agent's ACP inbox (may be empty when sending `--image`/`--resource`/`content`)

Options:
      --image <FILE>         Attach one or more local image files (PNG/JPEG/WebP/GIF/SVG, <= 8 MB) as native ACP image blocks
      --json                 JSON output even in a terminal
      --resource <FILE>      Attach one or more local files as ACP embedded resource blocks (text or binary <= 8 MB)
      --resource-link <URI>  Attach one or more URIs or file paths as ACP `resource_link` blocks
      --steer                Cancel the active ACP turn (`session/cancel`) and deliver this prompt next
      --if <STATUS>          Only enqueue if the status is exactly this [possible values: idle, working]
      --wait                 Wait for the turn this send triggers
      --timeout <TIMEOUT>    With wait: seconds before it checks in (default: config, else 180)
      --from <FROM>          Sender address attributed in `<h2 from="...">` tags (default: caller)
  -h, --help                 Print help
```

## h2 server

```text
Start, stop or inspect the core

Usage: h2 server [OPTIONS] <COMMAND>

Commands:
  start    
  stop     
  status   
  restart  Restart the core (e.g. after an update); kept agents resume via `session/load`
  help     Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 server restart

```text
Restart the core (e.g. after an update); kept agents resume via `session/load`

Usage: h2 server restart [OPTIONS]

Options:
      --fresh  Take this shell's environment for new agents; run from outside an agent
      --json   JSON output even in a terminal
  -h, --help   Print help
```

## h2 server start

```text
Usage: h2 server start [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 server status

```text
Usage: h2 server status [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 server stop

```text
Usage: h2 server stop [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 skill

```text
Detect coding agents and install/update bundled Herdr2 companion skills (`status`, `install`, `ai-install`)

Usage: h2 skill [OPTIONS] <COMMAND>

Commands:
  status      Inspect detected coding agent skill directories and installed Herdr2 skill versions
  install     Install or update bundled Herdr2 companion skills (`herdr2`, `drove`, `drove-add`, `drove-setup`)
  ai-install  Use built-in Core AI to inspect local or remote coding agents and install Herdr2 skills automatically
  help        Print this message or the help of the given subcommand(s)

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 skill ai-install

```text
Use built-in Core AI to inspect local or remote coding agents and install Herdr2 skills automatically

Usage: h2 skill ai-install [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --query <TEXT>  Optional hint about a custom agent name or desired skill location
      --lang <LANG>   Preferred explanation language (`zh-CN` or `en`)
      --dry-run       Plan only without writing skill files to disk
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 skill install

```text
Install or update bundled Herdr2 companion skills (`herdr2`, `drove`, `drove-add`, `drove-setup`)

Usage: h2 skill install [OPTIONS]

Options:
      --all              Install into all detected agent skill directories
      --json             JSON output even in a terminal
      --detected-only    Only install into agents actually detected on disk/PATH (do not create fallback dirs)
      --agent <AGENT>    Target a specific known agent ID (antigravity, claude, codex, cursor, opencode, windsurf)
      --target <DIR>     Target a custom skills root directory
      --skills <SKILLS>  Comma-separated subset of skills to install (default: all bundled skills)
      --on <MACHINE>     Target remote machine (`h2 machine ls`)
  -h, --help             Print help
```

## h2 skill status

```text
Inspect detected coding agent skill directories and installed Herdr2 skill versions

Usage: h2 skill status [OPTIONS]

Options:
      --json          JSON output even in a terminal
      --on <MACHINE>  Target remote machine (`h2 machine ls`)
  -h, --help          Print help
```

## h2 templates

```text
Templates you can run by name (~/.config/herdr2/templates)

Usage: h2 templates [OPTIONS]

Options:
      --json  JSON output even in a terminal
  -h, --help  Print help
```

## h2 update

```text
Swap this h2 for another build and restart core

Usage: h2 update [OPTIONS]

Options:
      --from <FILE>      A herdr2 binary to use (default: download the latest release)
      --json             JSON output even in a terminal
      --version <X.Y.Z>  At least this release (`0.1.4`): nothing changes when this h2 is already that or newer
      --force            Allow an older version (saved state only moves forward), or a release of another protocol generation
  -h, --help             Print help
```

## h2 wait

```text
Wait for children (--children any) or one agent; a message to you also ends it

Usage: h2 wait [OPTIONS] [AGENT]

Arguments:
  [AGENT]  The agent; with `children`, whose children (default: the caller)

Options:
      --children <CHILDREN>  Wait on children instead: all = until none is working, any = next news or a message to you [possible values: any, all]
      --json                 JSON output even in a terminal
      --output <OUTPUT>      End when streamed transcript output after the wait starts contains this text. Blocked, error or exit end it too
      --timeout <TIMEOUT>    Seconds before it checks in (default: config `wait_timeout`, else 180)
      --no-timeout           Wait indefinitely until status, exit, output, or message (for background runners)
  -h, --help                 Print help
```
