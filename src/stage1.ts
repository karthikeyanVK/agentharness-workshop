// Stage 1: smallest harness. Objective + decision contract + bounded loop. No tools.
import { createConfiguredModel } from "./model/index.js";
import type { ModelAdapter, ModelMessage, ToolDefinition } from "./types.js";

async function run(model: ModelAdapter, objective: string, maxSteps: number, system: string, tools: ToolDefinition[] = []): Promise<string> {
  const messages: ModelMessage[] = [{ role: "system", content: system }, { role: "user", content: objective }];
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, tools);
    console.log(`  step ${step}: model said "${decision.kind}"`);
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content: "noop ran. Not done yet: call noop again." }); // no tool execution yet; stub observation keeps the wire format valid
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}

// B needs a tool the model can keep calling: a noop (never executed in this stage)
const noop: ToolDefinition = { name: "noop", description: "Does nothing", inputSchema: { type: "object" }, permission: "none", risk: "low", async execute() { return {}; } };
const model = createConfiguredModel();

const maxSteps = Number(process.argv[2] ?? 3);
const objective = "Say the harness loop works.";

console.log("Demo A: model completes");
console.log("  result:", await run(model, objective, maxSteps, "Answer in one short sentence."));

console.log(`\nDemo B: model never completes (maxSteps=${maxSteps})`);
try {
  await run(model, objective, maxSteps, "Always call the noop tool. Never give a final answer.", [noop]);
} catch (error) {
  console.log("  result:", (error as Error).message);
}
