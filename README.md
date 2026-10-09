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
| 5 | [Policy Before Execution](./stages/stage5.md) | Risk vs limit | A model requesting a tool is not authorization. Policy checks before execution. |
| 6 | [Human Approval Gate](./stages/stage6.md) | Policy vs approval | Policy asks "may this ever run?"; approval asks "should it run this time?". Denied means it never runs. |
| 7 | [Context And Memory](./stages/stage7.md) | Context vs memory | Storing information is not the same as giving it to the model. |
| 8 | [Traces And Observability](./stages/stage8.md) | Explain a run | Output answers the task, memory retains outcomes, trace explains execution. |
