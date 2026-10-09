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

See [Building an Agent Harness: Step-by-Step Workshop Demo Plan](./WORKSHOP-DEMO-PLAN.md) for a teaching sequence that starts with a minimal loop and adds tools, registration, execution, policy, approval, context, memory, tracing, and CSV reading one module at a time.

## Start

```powershell
npm install
npm run dev
npm run build
```

The first slice demonstrates `LLM decision -> registry/policy validation -> execution -> structured result -> continuation`. All stages call the Azure adapter, so `AZURE_FOUNDRY_*` must be set in `.env`.

## Azure AI Foundry setup (GPT)

1. Rename `.env.example` to `.env`.
2. Update the keys in `.env`:
   - `AZURE_FOUNDRY_ENDPOINT`: your Foundry / Azure OpenAI resource URL, e.g. `https://<your-resource>.openai.azure.com`
   - `AZURE_FOUNDRY_API_KEY`: key from the resource's Keys and Endpoint page
   - `AZURE_FOUNDRY_DEPLOYMENT`: name of your GPT deployment (e.g. `gpt-4o`); replace the `claude-opus-5` default
   - `AZURE_FOUNDRY_API_VERSION`: API version, e.g. `2024-10-21`

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
