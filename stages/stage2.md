# Stage 2: Tool Feedback Loop

**Question:** How does the agent act and then observe what happened?

## Learn

One `calculate` tool. After each call, decision + tool result are appended to the messages so the next decision sees it.

## Setup

Create a new empty file `src/stage2.ts` in your editor. Build it in 5 steps. Paste each block exactly as shown, in order. Colors come from `src/color.ts`, which already exists.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 2: one tool + feedback loop. Decide -> call tool -> observe result -> decide -> complete.
import { createConfiguredModel } from "./model/index.js";
import { cyan, green } from "./color.js";
import type { ModelAdapter, ModelMessage, ToolDefinition } from "./types.js";


```

## Step 2: The calculate tool

A real tool this time: it adds two numbers. The loop will execute it.

```ts
const calculate: ToolDefinition<{ left: number; right: number }, { value: number }> = {
  name: "calculate",
  description: "Add two numbers",
  inputSchema: { type: "object", properties: { left: { type: "number" }, right: { type: "number" } }, required: ["left", "right"] },
  permission: "calculation",
  risk: "low",
  async execute({ left, right }) { return { value: left + right }; },
};


```

## Step 3: Build the messages

Same as Stage 1. Paste it unchanged.

```ts
function buildMessages(system: string, objective: string): ModelMessage[] {
  return [{ role: "system", content: system }, { role: "user", content: objective }];
}


```

## Step 4: The feedback loop

Changed from Stage 1: the loop now runs the tool and appends decision + result, so the next `decide` sees what happened.

```ts
async function run(model: ModelAdapter, objective: string, maxSteps: number): Promise<string> {
  const messages = buildMessages("You are an agent in a harness. Call tools when needed. When the objective is done, reply with a short final answer and no tool call.", objective);
  for (let step = 1; step <= maxSteps; step++) {
    console.log(`  model sees ${messages.length} message(s): ${messages.map((m) => m.role).join(", ")}`);
    const decision = await model.decide(messages, [calculate as ToolDefinition]);
    console.log(cyan(`  step ${step}: model said ${JSON.stringify(decision)}`));
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    // ponytail: direct tool call, no registry/engine yet (Stages 3-4 extract those)
    const result = await calculate.execute(decision.input as { left: number; right: number }, { objective, signal: new AbortController().signal });
    console.log(green(`  step ${step}: tool returned ${JSON.stringify(result)}`));
    // The feedback loop: append decision + observation so the next decision can see it
    messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content: JSON.stringify(result) });
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}


```

## Step 5: Entry point and first run

Paste at the very bottom of the file.

```ts
async function main(): Promise<void> {
  const left = Number(process.argv[2] ?? 21);
  const right = Number(process.argv[3] ?? 21);
  const model = createConfiguredModel();
  console.log(`Objective: add ${left} and ${right}`);
  console.log(green("  result:"), await run(model, `Add ${left} and ${right} using the calculate tool.`, 5));
}

await main();


```

## Run

```powershell
npm run stage2 [left] [right]


```

Example: `npm run stage2 6 7`

## Watch for

`model sees N message(s)` grows each step; `tool returned {"value":...}`; then a final answer.

## Try it

Ask for a tool the model cannot satisfy and watch where the loop stops.

---

[Previous: Stage 1](./stage1.md) | [Next: Stage 3](./stage3.md) | [Back to README](../README.md)
