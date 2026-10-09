# Stage 4: Execution Engine

**Question:** Where should execution controls live?

## Learn

Core decides, engine owns how a tool runs. Failures become observations, never fake successes.

## Setup

Create a new empty file `src/stage4.ts` in your editor. Build it in 5 steps. Paste each block exactly as shown, in order. `ExecutionEngine`, `PolicyEngine`, `AutoApproveForDemo` and `Trace` already exist in `src/`.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 4: execution engine. Core decides/continues/returns; engine owns HOW a tool runs.
// Core -> ExecutionEngine.execute() -> registry lookup -> tool.execute() -> result | error
import { AutoApproveForDemo } from "./approval.js";
import { ExecutionEngine } from "./engine.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import type { ModelAdapter, ModelMessage, ToolDefinition } from "./types.js";


```

## Step 2: Registry with a succeeding and a failing tool

`calculate` works. `fetch_exchange_rate` always throws, so you can watch failure handling.

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    name: "calculate", description: "Add two numbers", permission: "calculation", risk: "low",
    inputSchema: { type: "object", properties: { left: { type: "number" }, right: { type: "number" } }, required: ["left", "right"] },
    async execute(input, ctx) {
      const { left, right } = input as { left: number; right: number };
      console.log(`    [tool] calculate got objective="${ctx.objective}", signal.aborted=${ctx.signal.aborted}`);
      return { value: left + right };
    },
  } as ToolDefinition);

  // Learner exercise: a deliberately failing tool
  registry.register({
    name: "fetch_exchange_rate", description: "Look up a currency rate", permission: "network", risk: "low",
    inputSchema: { type: "object", properties: { currency: { type: "string" } }, required: ["currency"] },
    async execute() { throw new Error("rate service unreachable"); },
  } as ToolDefinition);
  return registry;
}


```

## Step 3: The engine

The engine wraps registry, policy, approval and trace. Policy, approval and trace are explained in Stages 5 to 8. Low-risk tools pass policy and skip approval.

```ts
function makeEngine(registry: ToolRegistry, trace: Trace): ExecutionEngine {
  return new ExecutionEngine(registry, new PolicyEngine(), new AutoApproveForDemo(), trace);
}


```

## Step 4: Build the messages and the loop

`buildMessages` is the same as Stage 3. Paste it unchanged.

```ts
function buildMessages(objective: string): ModelMessage[] {
  return [{ role: "system", content: "You are an agent in a harness. Call tools when needed. When the objective is done, reply with a short final answer and no tool call." }, { role: "user", content: objective }];
}


```

Changed from Stage 3: `run` calls `engine.execute` instead of `tool.execute`. A thrown error becomes a tool observation.

```ts
async function run(model: ModelAdapter, registry: ToolRegistry, engine: ExecutionEngine, objective: string, maxSteps = 5): Promise<string> {
  const messages = buildMessages(objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, registry.list());
    console.log(`  step ${step}: model said ${JSON.stringify(decision)}`);
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    messages.push({ role: "assistant", content: JSON.stringify(decision) });
    try {
      const result = await engine.execute(decision.toolName ?? "", decision.input, objective); // core doesn't know how tools run
      messages.push({ role: "tool", content: JSON.stringify(result) });
    } catch (error) {
      messages.push({ role: "tool", content: `Tool failed: ${String(error)}` }); // failure is an observation, never a fake success
    }
    console.log(`  step ${step}: observation -> ${messages.at(-1)!.content}`);
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}


```

## Step 5: Demo, entry point and first run

```ts
async function demoSuccessAndFailure(model: ModelAdapter, registry: ToolRegistry, engine: ExecutionEngine, trace: Trace) {
  console.log("Objective: add 21+21, then convert to EUR");
  console.log("  result:", await run(model, registry, engine, "Add 21 and 21 with calculate, then convert the total to EUR with fetch_exchange_rate. If a tool fails, say so and report what you have."));
  console.log("\nTrace (engine recorded success AND failure):");
  for (const e of trace.events) console.log(`  ${e.type}/${e.status} ${JSON.stringify(e.data)}`);
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main() {
  const model = createConfiguredModel();
  const registry = makeRegistry();
  const trace = new Trace();
  const engine = makeEngine(registry, trace);
  await demoSuccessAndFailure(model, registry, engine, trace);
}

await main();


```

## Run

```powershell
npm run stage4


```

## Watch for

One tool succeeds. `fetch_exchange_rate` fails with `rate service unreachable` and the model explains the failure.

## Try it

Add another failing tool and make the model complete with an explanation.

---

[Previous: Stage 3](./stage3.md) | [Next: Stage 5](./stage5.md) | [Back to README](../README.md)
