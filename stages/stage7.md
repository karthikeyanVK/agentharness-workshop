# Stage 7: Context And Memory

**Question:** What is the current task, and what has already happened?

## Learn

Context = the task (`ContextManager`). Conversation = model input inside one run. Memory = retained outcomes. Storing information is not giving it to the model.

## Setup

Create a new empty file `src/stage7.ts` in your editor. Build it in 5 steps. Paste each block exactly as shown, in order. Colors come from `src/color.ts`, which already exists. `AgentCore`, `ContextManager` and `Memory` already exist in `src/`. From here the loop lives in `AgentCore`.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 7: context vs conversation vs memory. Storing info != giving it to the model.
//   Context      = what is the task (objective + task state)       -> ContextManager
//   Conversation = model input inside ONE run                      -> local `messages` array in AgentCore.run()
//   Memory       = retained outcomes                               -> Memory (in-process strings, lost on restart)
import { AutoApproveForDemo } from "./approval.js";
import { ContextManager } from "./context.js";
import { AgentCore } from "./core.js";
import { ExecutionEngine } from "./engine.js";
import { Memory } from "./memory.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import { cyan, green } from "./color.js";
import type { ModelAdapter, ToolDefinition } from "./types.js";


```

## Step 2: Registry

Same tools as Stage 4: one that works, one that fails. Paste it unchanged.

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    name: "calculate", description: "Add two numbers", permission: "calculation", risk: "low", inputSchema: { type: "object", properties: { left: { type: "number" }, right: { type: "number" } }, required: ["left", "right"] },
    async execute(input) { const { left, right } = input as { left: number; right: number }; return { value: left + right }; },
  } as ToolDefinition);
  registry.register({
    name: "fetch_exchange_rate", description: "Look up a currency rate", permission: "network", risk: "low", inputSchema: { type: "object", properties: { currency: { type: "string" } } },
    async execute() { throw new Error("rate service unreachable"); },
  } as ToolDefinition);
  return registry;
}


```

## Step 3: Spy model and core

`spyModel` wraps the real model and prints exactly what the LLM is given on its first decision.

```ts
function spyModel(label: string, inner: ModelAdapter = createConfiguredModel()): ModelAdapter {
  let first = true;
  return {
    id: inner.id,
    async decide(messages, tools) {
      if (first) {
        first = false;
        console.log(`  [${label}] model input on first decision:`);
        for (const m of messages) console.log(`    ${m.role.padEnd(9)} ${m.content}`);
      }
      return inner.decide(messages, tools);
    },
  };
}


```

`makeCore` wires `AgentCore` with a context and a shared memory.

```ts
function makeCore(registry: ToolRegistry, memory: Memory, model: ModelAdapter, context: ContextManager): AgentCore {
  const trace = new Trace();
  return new AgentCore(model, registry, new ExecutionEngine(registry, new PolicyEngine(), new AutoApproveForDemo(), trace), context, memory, trace);
}


```

## Step 4: Run 1, context is stored but not sent

```ts
async function demoRun1(registry: ToolRegistry, memory: Memory): Promise<void> {
  const context1 = new ContextManager("Add 21+21 with calculate, then convert the total to EUR with fetch_exchange_rate. Report failures.", { user: "karthik", locale: "en-IN" });
  context1.working.currency = "EUR";
  context1.business.customerTier = "gold";

  console.log(cyan("== Run 1 =="));
  console.log("  context.objective:  ", context1.objective);
  console.log("  context.userContext:", JSON.stringify(context1.userContext));
  console.log("  context.working:    ", JSON.stringify(context1.working));
  console.log("  context.business:   ", JSON.stringify(context1.business));
  console.log(green("  result:"), await makeCore(registry, memory, spyModel("run1"), context1).run());
  console.log("  NOT in model input: userContext, working, business (core only sends objective)");

  console.log("\n  memory.recent() after run 1:");
  for (const entry of memory.recent()) console.log(`    - ${entry}`);
}


```

## Step 5: Run 2, entry point and run

Run 2 reuses the same `Memory` with a new task.

```ts
async function demoRun2(registry: ToolRegistry, memory: Memory): Promise<void> {
  console.log(cyan("\n== Run 2 (same memory object, new objective) =="));
  console.log(green("  result:"), await makeCore(registry, memory, spyModel("run2"), new ContextManager("What was the sum from before?")).run());
  console.log(`  memory holds ${memory.recent().length} entries, but none reached the model: core never reads memory into messages.`);
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main(): Promise<void> {
  const registry = makeRegistry();
  const memory = new Memory(); // shared across both runs
  await demoRun1(registry, memory);
  await demoRun2(registry, memory);

  // Learner exercise (proposal only, not implemented): bounded context assembly, e.g.
  //   messages = [system, user(objective), ...memory.recent().slice(-3).map(m => ({ role: "system", content: `Prior outcome: ${m}` }))]
  //   bounded by count AND characters, failures labelled, never raw secrets.
}

await main();


```

## Run

```powershell
npm run stage7


```

## Watch for

`spyModel` prints exactly what the LLM saw. Run 2 sees memory from run 1 only because it is shared.

## Try it

Use a fresh `Memory` for run 2 and predict the answer.

---

[Previous: Stage 6](./stage6.md) | [Next: Stage 8](./stage8.md) | [Back to README](../README.md)
