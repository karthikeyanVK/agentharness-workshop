# Stage 1: Bounded Agent Loop

**Question:** What makes this a harness rather than a single model call?

## Learn

Objective, decision contract (`tool_call` / `complete` / `message`), bounded steps. The harness ends runs, not the model.

## Setup

- Create a new empty file `src/stage1.ts` in your editor.
- Build it in 5 steps.
- Paste each block exactly as shown, in order.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 1: smallest harness. Objective + decision contract + bounded loop. No tools.
import { createConfiguredModel } from "./model/index.js";
import { cyan, green, red } from "./color.js";
import type { ModelAdapter, ModelMessage, ToolDefinition } from "./types.js";


```

## Step 2: Build the messages

System prompt sets behavior, user message carries the objective.

```ts
function buildMessages(system: string, objective: string): ModelMessage[] {
  return [{ role: "system", content: system }, { role: "user", content: objective }];
}


```

## Step 3: The bounded loop

This is the harness. The model decides, the loop enforces `maxSteps`.

```ts
async function run(model: ModelAdapter, objective: string, maxSteps: number, system: string, tools: ToolDefinition[] = []): Promise<string> {
  const messages = buildMessages(system, objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, tools);
    console.log(cyan(`  step ${step}: model said "${decision.kind}"`));
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content: "noop ran. Not done yet: call noop again." }); // no tool execution yet; stub observation keeps the wire format valid
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}


```

## Step 4: Demo A, model completes, and first run

Paste Demo A, then paste the entry point **below it** at the very bottom of the file.

```ts
async function demoA(model: ModelAdapter, objective: string, maxSteps: number): Promise<void> {
  console.log("Demo A: model completes");
  console.log(green("  result:"), await run(model, objective, maxSteps, "Answer in one short sentence."));
}


```

```ts
// ---- STAGE 1: entry point ----
async function main(): Promise<void> {
  const model = createConfiguredModel();
  const maxSteps = Number(process.argv[2] ?? 3);
  const objective = "Say the harness loop works.";
  await demoA(model, objective, maxSteps);
}

await main();


```

Run it:

```powershell
npm run stage1


```

Expected: `step 1: model said "complete"` and a one-sentence result.

## Step 5: Demo B, harness stops a runaway loop

Paste both blocks **above** the `// ---- STAGE 1: entry point ----` line (a `const` must be defined before `main` runs).

A tool the model can keep calling. It is never executed in this stage.

```ts
const noop: ToolDefinition = { name: "noop", description: "Does nothing", inputSchema: { type: "object" }, permission: "none", risk: "low", async execute() { return {}; } };


```

```ts
async function demoB(model: ModelAdapter, objective: string, maxSteps: number): Promise<void> {
  console.log(`\nDemo B: model never completes (maxSteps=${maxSteps})`);
  try {
    await run(model, objective, maxSteps, "Always call the noop tool. Never give a final answer.", [noop]);
  } catch (error) {
    console.log(red("  result:"), (error as Error).message);
  }
}


```

Now edit `main` in place: add this one line right after the `await demoA(...)` line.

```ts
  await demoB(model, objective, maxSteps);


```

`main` should now look like this:

```ts
async function main(): Promise<void> {
  const model = createConfiguredModel();
  const maxSteps = Number(process.argv[2] ?? 3);
  const objective = "Say the harness loop works.";
  await demoA(model, objective, maxSteps);
  await demoB(model, objective, maxSteps);
}


```

## Run

```powershell
npm run stage1 [maxSteps]


```

Example: `npm run stage1 2`

## Watch for

Demo A: model completes in one step. Demo B: model never completes, harness throws `stopped by harness after N steps`.

## Try it

Change `maxSteps` and predict how many `step N` lines print in Demo B.

---

[Next: Stage 2](./stage2.md) | [Back to README](../README.md)
