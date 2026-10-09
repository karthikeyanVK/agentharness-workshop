# Stage 3: Tool Registry

**Question:** How do we add tools without growing a chain of conditionals in the loop?

## Learn

`ToolRegistry` looks tools up by name. Unknown and duplicate tools are rejected. The loop never names a tool.

## Setup

- Create a new empty file `src/stage3.ts` in your editor.
- Build it in 5 steps.
- Paste each block exactly as shown, in order.

## Step 1: Imports and shared schema

Paste at the top of the file.

```ts
// Stage 3: tool registry. Loop looks tools up by name -> no tool-specific branching in the loop.
import { ToolRegistry } from "./registry.js";
import { createConfiguredModel } from "./model/index.js";
import { cyan, green, red } from "./color.js";
import type { ModelAdapter, ModelMessage, ToolDefinition } from "./types.js";

type Pair = { left: number; right: number };
const pairSchema = { type: "object", properties: { left: { type: "number" }, right: { type: "number" } }, required: ["left", "right"] };


```

## Step 2: Tools and registry

Two pure tools. The registry holds them by name.

```ts
const calculate: ToolDefinition<Pair, { value: number }> = {
  name: "calculate",               // lookup key the model uses
  description: "Add two numbers",  // tells the model what it does
  inputSchema: pairSchema,         // describes input shape (NOT validated here)
  permission: "calculation",       // used by policy in Stage 5
  risk: "low",                     // used by approval in Stage 6
  async execute({ left, right }) { return { value: left + right }; },
};


```

```ts
// Learner exercise: second pure tool. Loop below needs zero changes for it.
const multiply: ToolDefinition<Pair, { value: number }> = {
  name: "multiply", description: "Multiply two numbers", inputSchema: pairSchema, permission: "calculation", risk: "low",
  async execute({ left, right }) { return { value: left * right }; },
};


```

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(calculate as ToolDefinition);
  registry.register(multiply as ToolDefinition);
  return registry;
}


```

## Step 3: Build the messages

Same as Stage 2, with the system prompt inlined. Paste it unchanged.

```ts
function buildMessages(objective: string): ModelMessage[] {
  return [{ role: "system", content: "You are an agent in a harness. Call tools when needed. When the objective is done, reply with a short final answer and no tool call." }, { role: "user", content: objective }];
}


```

## Step 4: The loop uses the registry

Changed from Stage 2: no `calculate.execute` call. The loop asks the registry for the tool by name.

```ts
async function run(model: ModelAdapter, registry: ToolRegistry, objective: string, maxSteps = 5, extraTools: ToolDefinition[] = []): Promise<string> {
  const messages = buildMessages(objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, [...registry.list(), ...extraTools]); // model sees the catalog
    console.log(cyan(`  step ${step}: model said ${JSON.stringify(decision)}`));
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    const tool = registry.get(decision.toolName ?? "");             // generic lookup, throws on unknown
    const result = await tool.execute(decision.input, { objective, signal: new AbortController().signal });
    console.log(green(`  step ${step}: ${tool.name} returned ${JSON.stringify(result)}`));
    messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content: JSON.stringify(result) });
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}


```

## Step 5: Demos, entry point and run

Three demos: the happy path, an unknown tool, a duplicate register.

```ts
async function demoAddThenMultiply(model: ModelAdapter, registry: ToolRegistry) {
  console.log("Demo A: add then multiply via registry");
  console.log(green("  result:"), await run(model, registry, "Add 21+21 with calculate, then multiply 6*7 with multiply.", 5));
}


```

```ts
async function demoUnknownTool(model: ModelAdapter, registry: ToolRegistry) {
  // advertise a tool the registry never had, so the model can ask for it
  const divide: ToolDefinition = { name: "divide", description: "Divide two numbers", inputSchema: pairSchema, permission: "calculation", risk: "low", async execute() { return {}; } };
  console.log("\nDemo B: model asks for a tool that does not exist");
  try {
    await run(model, registry, "Divide 1 by 4 using the divide tool.", 5, [divide]);
  } catch (error) {
    console.log(red("  error:"), (error as Error).message);
  }
}


```

```ts
function demoDuplicateRegister(registry: ToolRegistry) {
  console.log("\nDemo C: register the same tool twice");
  try {
    registry.register(calculate as ToolDefinition);
  } catch (error) {
    console.log(red("  error:"), (error as Error).message);
  }
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main() {
  const model = createConfiguredModel();
  const registry = makeRegistry();
  await demoAddThenMultiply(model, registry);
  await demoUnknownTool(model, registry);
  demoDuplicateRegister(registry);
}

await main();


```

## Run

```powershell
npm run stage3


```

## Watch for

Demo A: add then multiply. Demo B: error for unknown `divide` tool. Demo C: error for duplicate register.

## Try it

Add a third pure tool. The `run` function needs zero changes.

---

[Previous: Stage 2](./stage2.md) | [Next: Stage 4](./stage4.md) | [Back to README](../README.md)
