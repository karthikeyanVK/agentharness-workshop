// Stage 1: smallest harness. Objective + decision contract + bounded loop. No tools.
// Modular: each function = one harness concern. run() just composes them.
import { createConfiguredModel } from "./model/index.js";
import type { ModelAdapter, ModelDecision, ModelMessage, ToolDefinition } from "./types.js";

// 1. Objective -> starting conversation
function buildMessages(system: string, objective: string): ModelMessage[] {
  return [{ role: "system", content: system }, { role: "user", content: objective }];
}

// 2. Decision contract: which decisions end the loop?
function isFinal(decision: ModelDecision): boolean {
  return decision.kind === "complete" || decision.kind === "message";
}

// 3. Observation: no tool execution yet; stub keeps the wire format valid
function recordStep(messages: ModelMessage[], decision: ModelDecision): void {
  messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content: "noop ran. Not done yet: call noop again." });
}

// 4. Bounded loop: compose the pieces above, stop after maxSteps
async function run(model: ModelAdapter, objective: string, maxSteps: number, system: string, tools: ToolDefinition[] = []): Promise<string> {
  const messages = buildMessages(system, objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, tools);
    console.log(`  step ${step}: model said "${decision.kind}"`);
    if (isFinal(decision)) return decision.content ?? "";
    recordStep(messages, decision);
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}

// B needs a tool the model can keep calling: a noop (never executed in this stage)
const noop: ToolDefinition = { name: "noop", description: "Does nothing", inputSchema: { type: "object" }, permission: "none", risk: "low", async execute() { return {}; } };

// 5. Demos
async function demoComplete(model: ModelAdapter, objective: string, maxSteps: number): Promise<void> {
  console.log("Demo A: model completes");
  console.log("  result:", await run(model, objective, maxSteps, "Answer in one short sentence."));
}

async function demoNeverCompletes(model: ModelAdapter, objective: string, maxSteps: number): Promise<void> {
  console.log(`\nDemo B: model never completes (maxSteps=${maxSteps})`);
  try {
    await run(model, objective, maxSteps, "Always call the noop tool. Never give a final answer.", [noop]);
  } catch (error) {
    console.log("  result:", (error as Error).message);
  }
}

const model = createConfiguredModel();
const maxSteps = Number(process.argv[2] ?? 3);
const objective = "Say the harness loop works.";

await demoComplete(model, objective, maxSteps);
await demoNeverCompletes(model, objective, maxSteps);
