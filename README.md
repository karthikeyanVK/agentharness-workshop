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

## Start

```powershell
npm install
npm run dev
npm run build
```

The first slice demonstrates `LLM decision -> registry/policy validation -> execution -> structured result -> continuation`. The demo model is deterministic and requires no credentials.

## Azure AI Foundry

Set `AZURE_FOUNDRY_ENDPOINT`, `AZURE_FOUNDRY_API_KEY`, and `AZURE_FOUNDRY_DEPLOYMENT` when wiring `AzureFoundryClaudeAdapter` into an application entrypoint. Provider adapters live under `src/model`; Agent Core has no Azure or Claude dependency.

Future OpenAI, Gemini, Anthropic, MCP, browser, ShopKart, and file/TypeScript execution adapters should remain outside `src/core.ts` and be registered as tools or environments.

## Runtime execution demo

Details: [RUNTIME-DEMO.md](./RUNTIME-DEMO.md).

`npm run runtime-demo` — the agent inspects ShopKart `.xlsx` files, writes and runs TypeScript in a sandboxed `workspace/` (`input/`, `working/`, `output/`), verifies the generated report, then answers. Code lives in `src/runtime/` and plugs into the registry via `registerRuntimeTools`. Uses Azure Foundry if `AZURE_FOUNDRY_*` is set, otherwise an offline stand-in model (the analysis code is model-side; the harness only validates, runs and traces it).
