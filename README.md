# Agent Harness Workshop

A modular, model-agnostic TypeScript execution and control layer.

## Workshop guide

See [Building an Agent Harness: Step-by-Step Workshop Demo Plan](./WORKSHOP-DEMO-PLAN.md) for a teaching sequence that starts with a minimal loop and adds tools, registration, execution, policy, approval, context, memory, tracing, and CSV reading one module at a time.

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
