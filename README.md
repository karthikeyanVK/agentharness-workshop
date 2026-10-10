# Agent Harness Workshop

A modular, model-agnostic TypeScript execution and control layer.

## What the workshop teaches

Learn the enterprise agent harness by first fixing the basics, then strengthening them, then building one ready for the future.

**Fix the basics**
- The loop. Objective, decision contract (`tool_call` / `complete` / `message`), bounded steps. The harness ends runs, not the model.
- One tool + feedback loop. Decide, call tool, observe, decide again.
- Tool registry. Lookup by name, no tool-specific branching, unknown and duplicate tools rejected.
- Execution engine. Core decides; engine owns how a tool runs. Failures become observations, never fake successes.

**Strengthen it**
- Policy. A model requesting a tool is not authorization. Risk vs limit, checked before execution.
- Approval. Policy asks "may this ever run?"; approval asks "should it run this time?" Human or scripted approver.
- Context, conversation, memory. Storing information is not the same as giving it to the model.
- Traces. Output answers the task, memory retains outcomes, trace explains execution.

**Build for the future**
- Real model through a provider adapter (Azure Foundry today). Swap providers without touching Agent Core.
- Runtime execution. Agent writes and runs code in a sandboxed workspace; harness validates, runs, traces.
- New tools, MCP, browser, and file adapters plug in as registry tools, not core changes.
- Same controls (registry, policy, approval, trace) keep working as capability grows.

## Workshop guide

A teaching sequence that starts with a minimal loop and adds tools, registration, execution, policy, approval, context, memory, tracing, and CSV reading one module at a time.

## Start

1. Open a terminal (PowerShell on Windows, Terminal on Mac/Linux).
2. Clone the repo and open it in VS Code (or your favourite editor):

```powershell
git clone https://github.com/karthikeyanVK/agentharness-workshop
cd agentharness-workshop
code .


```

3. In the editor, open the integrated terminal (`` Ctrl+` ``) and run the rest of the commands there:

```powershell
npm install
npm run dev
npm run build


```
## Azure AI Foundry setup (GPT)

1. rename `.env.example` to `.env`:

2. Open `.env`. `AZURE_FOUNDRY_ENDPOINT`, `AZURE_FOUNDRY_DEPLOYMENT` and `AZURE_FOUNDRY_API_VERSION` are already filled in. Leave them as they are.
3. Get the API key from the [workshop key document](https://docs.google.com/document/d/1eGTPBKxi8MSrnD7pVhVgVBncIB-Rmfo6XVrSbk8_UsA/edit?usp=sharing) and paste it after `AZURE_FOUNDRY_API_KEY=`.
4. Never commit `.env`. It is already in `.gitignore`.

## Workshop - Stages

| Stage | Name | Teaches | Description |
| --- | --- | --- | --- |
| 1 | [Bounded Agent Loop](./stages/stage1.md) | Objective, decision contract, step limit | Smallest harness. The harness ends runs, not the model. No tools. |
| 2 | [Tool Feedback Loop](./stages/stage2.md) | Decide, act, observe | One `calculate` tool. Its result goes back to the model for the next decision. |
| 3 | [Tool Registry](./stages/stage3.md) | Lookup by name | Registry replaces conditionals in the loop. Unknown and duplicate tools are rejected. |
| 4 | [Execution Engine](./stages/stage4.md) | Controlled tool running | Engine owns how a tool runs. Failures become observations, never fake successes. |
| 5 | [Policy and Human Feedback](./stages/stage5.md) | Risk vs limit | A model requesting a tool is not authorization. Policy checks before execution. |
| 6 | [Scripted Approval for Automated Testing](./stages/stage6.md) | Scripted approvers | Same approval question as Stage 5, answered by scripted approvers so it runs unattended and repeatably. Denied means it never runs. |
| 7 | [Traces And Observability](./stages/stage7.md) | Explain a run | Output answers the task, memory retains outcomes, trace explains execution. |

## Enterprise Agent Harness - Marketing

After Stage 7, build one complete, enterprise-style harness: an agent that analyzes marketing data by writing and running code in a fenced workspace. Same Agent Core, registry, policy, approval and trace; the new capability is just more tools.

| Build | Name | Teaches | Description |
| --- | --- | --- | --- |
| Marketing | [Enterprise Agent Harness - Marketing](./enterpriseagentharness.md) | Runtime execution | Agent inspects CSV files, writes TypeScript, the harness runs it in a sandboxed workspace, and the agent reads back a management report. Run with `npm run enterprise-marketing-agent-harness`. |

## Desktop App - Electron

Last build: package the harness as a full-fledged desktop app, like Claude Code. Express server, React UI and harness bundled into one installable Electron app. No Node, repo or tsx needed on the user's machine.

| Build | Name | Teaches | Description |
| --- | --- | --- | --- |
| Desktop | [Agent Harness - Electron App](./AgentHarness-electronapp.md) | Packaging and distribution | Paste the prompt below into Claude Code at the repo root. It builds a `desktop/` folder with electron-builder, producing a Windows NSIS installer and portable `.exe`, with a first-run settings screen for the Azure key. |

Before sharing the result:
- Unsigned Windows installers trigger SmartScreen warnings. Only a code-signing certificate fixes that; the prompt does not cover it.
- Each person needs their own Azure key, which is why requirement 5 asks for a settings screen instead of bundling one.

Prompt:

````md
Context: this repo is a TypeScript agent harness (src/), an Express+SSE server (server/), a Vite+React UI (web/) and a dev-only Electron shell (electron/). Read ARCHITECTURE.md and CLAUDE.md first and follow CLAUDE.md. Do not change the behavior of src/, server/ or web/ except where this prompt says so. Keep the existing electron/ dev flow working.

Goal: produce a shareable desktop installer for Windows (NSIS .exe plus a portable .exe) that a non-developer can double-click, with no Node, npm, repo or tsx installed. Add it as a new folder `desktop/` with its own package.json, using electron-builder.

## Requirements

1. **Bundle the server.** Use esbuild to bundle server/index.ts (and the src/ code it imports, including the `typescript` package that execute_typescript uses) into one file. No tsx at runtime. Bundle the built web/dist as static assets.
2. **Run the server inside the packaged app** (in the Electron main process, or as a child using ELECTRON_RUN_AS_NODE=1) on a free localhost port. Remove the hard-coded 8787 for the packaged build: the server takes its port from env, and the UI learns the API base at runtime (for example via a preload-exposed value or a config endpoint), without breaking `npm run web` and `npm run server` in dev.
3. **Generated-code sandbox.** src/enterprise-marketing-agent-harness.ts runs model code via `execFile(process.execPath, ["--permission", ...], { env: {} })`. In a packaged Electron app `process.execPath` is the Electron binary, and an empty env makes it launch the GUI instead of running the script. Fix this minimally, for example by passing ELECTRON_RUN_AS_NODE=1 in the child env only. Keep the rest of the sandbox unchanged (the --permission flags, read/write fences, 25 s timeout, 1 MB buffer). Confirm the Node version inside Electron supports --permission and every flag used. If not, say so and propose an alternative.
4. **Writable data.** A packaged app cannot write inside its install directory. Seed workspace/ (the input CSVs) into `app.getPath("userData")/workspace` on first run, and make the harness use that path through an env var or option, defaulting to `./workspace` so the dev flow is unchanged. working/ and output/ are recreated per run.
5. **Secrets.** NEVER bundle .env or any API key into the installer. Add a first-run settings screen or dialog that asks for AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY, AZURE_FOUNDRY_DEPLOYMENT and AZURE_FOUNDRY_API_VERSION. Store the key with Electron safeStorage in userData, inject the values into the server environment, and provide a way to re-open settings. Make sure the electron-builder `files` config excludes .env, node_modules/.cache, workspace/working and workspace/output.
6. **Lifecycle.** Kill the server on app quit, even on a force close. Single-instance lock. If the server fails to start or the key is missing, show a clear error dialog instead of a blank window.
7. **Security.** contextIsolation on, nodeIntegration off, sandbox on, external links open in the default browser, serve the UI only on 127.0.0.1.
8. **Scripts** in desktop/package.json: `build:web`, `bundle:server`, `dist` (builds the installer into desktop/release/) and `start` (runs the packaged-style app unpackaged for quick testing). Add desktop/release/ and desktop/build/ to .gitignore.

## Validation

Do all of it and report real results, not assumptions.

- Run `npm run dist`, then launch the produced exe from a clean folder with no repo, no .env, and no Node on PATH.
- Complete first-run settings, run the default request with Auto-approve, and confirm execute_typescript really succeeds (exit 0, report written to output/) and the summary table renders. Drive it over the Chrome DevTools Protocol (--remote-debugging-port) or a screenshot, because a server health check alone is not enough.
- Run it again without Auto-approve and confirm Approve and Deny both work.
- Close the window mid-approval and confirm no orphan node/electron processes remain and a new launch works.
- Confirm the installer contains no API key (search the unpacked app.asar for the key and for .env).
- Check for zero-byte files per CLAUDE.md.

Report the installer size, the Node version inside Electron, and anything you could not verify. Do not commit unless I ask.


````
