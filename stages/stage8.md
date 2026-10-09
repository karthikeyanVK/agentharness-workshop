# Stage 8: Traces And Observability

**Question:** How can we explain what the harness actually did?

## Learn

Output answers the task, memory retains outcomes, trace explains execution.

## Setup

Create a new empty file `src/stage8.ts` in your editor. Build it in 5 steps. Paste each block exactly as shown, in order. Colors come from `src/color.ts`, which already exists. `Trace` and `TraceEvent` already exist in `src/trace.ts`.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 8: traces. Output answers the task, memory retains outcomes, trace explains execution.
import { AutoApproveForDemo } from "./approval.js";
import { ContextManager } from "./context.js";
import { AgentCore } from "./core.js";
import { ExecutionEngine } from "./engine.js";
import { Memory } from "./memory.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace, type TraceEvent } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import { cyan, green, red, yellow } from "./color.js";
import type { RiskLevel, ToolDefinition } from "./types.js";


```

## Step 2: Tool helper and registry

A small helper keeps tool definitions short. The registry has a failing tool, a high-risk tool and a critical tool.

```ts
const tool = (name: string, risk: RiskLevel, description: string, properties: Record<string, unknown>, execute: ToolDefinition["execute"]): ToolDefinition =>
  ({ name, risk, description, permission: "demo", inputSchema: { type: "object", properties }, execute });


```

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(tool("calculate", "low", "Add two numbers", { left: { type: "number" }, right: { type: "number" } }, async (input) => { const { left, right } = input as { left: number; right: number }; return { value: left + right }; }));
  registry.register(tool("fetch_exchange_rate", "low", "Look up a currency rate", { currency: { type: "string" } }, async () => { throw new Error("rate service unreachable"); }));
  registry.register(tool("delete_temp_rows", "high", "Delete rows from a table", { table: { type: "string" } }, async () => ({ deleted: 3, simulated: true })));
  registry.register(tool("wipe_production", "critical", "Wipe the production environment", {}, async () => ({ wiped: true })));
  return registry;
}


```

## Step 3: Run the agent

Same wiring as Stage 7, but the `Trace` is passed in so you can read it afterwards. Policy limit is `high`, so `wipe_production` is blocked.

```ts
async function runAgent(registry: ToolRegistry, trace: Trace, memory: Memory): Promise<string> {
  const engine = new ExecutionEngine(registry, new PolicyEngine("high"), new AutoApproveForDemo(), trace);
  return await new AgentCore(createConfiguredModel(), registry, engine, new ContextManager("Do these in order, one tool call at a time: calculate 21+21; fetch_exchange_rate for EUR; delete_temp_rows on table temp; wipe_production. Do not retry failures. Then summarize what happened."), memory, trace).run();
}


```

## Step 4: Narrate and print the trace

`narrate` turns a raw trace event into a sentence. `printTrace` prints every event in order.

```ts
function narrate(e: TraceEvent): string {
  const d = e.data as Record<string, unknown>;
  if (e.type === "decision") return d.kind === "tool_call" ? `model proposed ${d.toolName}(${JSON.stringify(d.input)})` : `model finished (${String(d.content).length} chars, see OUTPUT below)`;
  if (e.status === "awaiting_approval") return `paused for approval of ${d.tool}`;
  if (e.status === "running") return `engine started ${d.tool}`;
  if (e.status === "succeeded") return `${d.tool} succeeded -> ${JSON.stringify(d.result)}`;
  if (e.status === "failed") return `${d.tool} FAILED -> ${d.error}`;
  return JSON.stringify(e);
}


```

`paint` picks a color per event: red failed, green succeeded, yellow awaiting approval, cyan model decisions.

```ts
const paint = (e: TraceEvent): ((s: string) => string) =>
  e.status === "failed" ? red : e.status === "succeeded" ? green : e.status === "awaiting_approval" ? yellow : e.type === "decision" ? cyan : (s) => s;


```

```ts
function printTrace(trace: Trace): void {
  console.log(cyan("== Trace, narrated in order =="));
  trace.events.forEach((e, n) => console.log(`  ${String(n + 1).padStart(2)}. ${e.at.slice(11, 23)} ${paint(e)(`${e.type}/${e.status}`.padEnd(26))} ${paint(e)(narrate(e))}`));
}


```

## Step 5: Compare the surfaces, entry point and run

Output, memory and trace side by side.

```ts
function printSurfaces(output: string, memory: Memory, trace: Trace): void {
  console.log(cyan("\n== Three surfaces, compared =="));
  console.log(green("  OUTPUT (answers the task):"));
  for (const line of output.split("\n")) console.log(`    ${line}`);
  console.log(yellow("  MEMORY (retained outcomes):"));
  for (const m of memory.recent()) console.log(`    - ${(m.startsWith("Tool failed") ? red : green)(m)}`);
  console.log(cyan(`  TRACE  (explains execution): ${trace.events.length} events above`));
}


```

Learner exercise: query the trace for `wipe_production`.

```ts
function printWipeExercise(trace: Trace): void {
  const wipe = trace.events.filter((e) => JSON.stringify(e.data).includes("wipe_production"));
  console.log(cyan("\n== Exercise: wipe_production in the trace =="));
  for (const e of wipe) console.log(`  ${paint(e)(`${e.type}/${e.status}`)}`);
  console.log(`  ${green("Can infer:")} model proposed it.`);
  console.log(`  ${red("Cannot infer:")} why it did not run (no failed event; reason only in memory).`);
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main(): Promise<void> {
  const registry = makeRegistry();
  const trace = new Trace();
  const memory = new Memory();
  const output = await runAgent(registry, trace, memory);
  printTrace(trace);
  printSurfaces(output, memory, trace);
  printWipeExercise(trace);
}

await main();


```

## Run

```powershell
npm run stage8


```

## Watch for

Trace printed in order with sentences from `narrate`, then output vs memory vs trace side by side.

## Try it

Query the trace to answer: did `wipe_production` ever execute?

---

[Previous: Stage 7](./stage7.md) | [Back to README](../README.md)
