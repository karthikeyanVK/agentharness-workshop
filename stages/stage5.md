# Stage 5: Policy Before Execution

**Question:** Should every proposed action be allowed?

## Learn

A model requesting a tool is not authorization. `PolicyEngine` compares tool risk to a limit before execution.

## Setup

Create a new empty file `src/stage5.ts` in your editor. Build it in 5 steps. Paste each block exactly as shown, in order. `PolicyEngine` already exists in `src/policy.ts`.

## Step 1: Imports and risk levels

Paste at the top of the file.

```ts
// Stage 5: policy before execution. Model REQUESTING a tool is not authorization.
import { TerminalApproval } from "./approval.js";
import { ExecutionEngine } from "./engine.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import type { ModelAdapter, ModelMessage, RiskLevel, ToolDefinition } from "./types.js";

const risks: RiskLevel[] = ["low", "medium", "high", "critical"];


```

## Step 2: Policy limit from the command line

Reads and validates the limit, default `medium`.

```ts
function parseLimit(): RiskLevel {
  const limit = (process.argv[2] ?? "medium") as RiskLevel;
  if (!risks.includes(limit)) throw new Error(`policy limit must be one of: ${risks.join(", ")}`);
  return limit;
}


```

## Step 3: Simulated tools, registry and engine

Harmless simulated tools, one per risk label. `executed` proves whether `execute()` ever ran.

```ts
const executed: string[] = [];
function sim(name: string, risk: RiskLevel): ToolDefinition {
  return {
    name, risk, description: `Simulated ${risk}-risk action`, permission: "demo", inputSchema: { type: "object", properties: { table: { type: "string" }, week: { type: "number" } } },
    async execute() { executed.push(name); return { ok: true, simulated: name }; },
  };
}


```

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(sim("read_report", "low"));
  registry.register(sim("delete_all_records", "high")); // harmless simulation labeled high
  return registry;
}


```

Changed from Stage 4: `PolicyEngine` now gets the limit, and `TerminalApproval` asks you in the terminal before a high-risk tool runs. Type `y` to approve; anything else denies.

```ts
function makeEngine(registry: ToolRegistry, limit: RiskLevel): ExecutionEngine {
  return new ExecutionEngine(registry, new PolicyEngine(limit), new TerminalApproval(), new Trace());
}


```

## Step 4: Build the messages and the loop

Same as Stage 4. Paste both unchanged.

```ts
function buildMessages(objective: string): ModelMessage[] {
  return [{ role: "system", content: "You are an agent in a harness. Call tools when needed. When the objective is done, reply with a short final answer and no tool call." }, { role: "user", content: objective }];
}


```

```ts
async function run(model: ModelAdapter, engine: ExecutionEngine, registry: ToolRegistry, objective: string, maxSteps = 5): Promise<string> {
  const messages = buildMessages(objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, registry.list()); // discovery: model SEES high-risk tool
    console.log(`  step ${step}: model requested ${decision.toolName ?? decision.kind}`);
    if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
    messages.push({ role: "assistant", content: JSON.stringify(decision) });
    try {
      messages.push({ role: "tool", content: JSON.stringify(await engine.execute(decision.toolName ?? "", decision.input, objective)) });
    } catch (error) {
      messages.push({ role: "tool", content: `Tool failed: ${String(error)}` }); // denial = observation
    }
    console.log(`  step ${step}: observation -> ${messages.at(-1)!.content}`);
  }
  throw new Error(`stopped by harness after ${maxSteps} steps`);
}


```

## Step 5: Policy matrix, entry point and run

Learner exercise: prints every risk label against every policy limit.

```ts
function printPolicyMatrix(): void {
  console.log("\nPolicy matrix (rows = tool risk, cols = policy limit)");
  console.log(`  ${"".padEnd(9)}${risks.map((r) => r.padEnd(10)).join("")}`);
  for (const risk of risks) {
    const cells = risks.map((max) => {
      const d = new PolicyEngine(max).authorize(sim("x", risk));
      return (d.allowed ? (d.requiresApproval ? "approval" : "allow") : "DENY").padEnd(10);
    });
    console.log(`  ${risk.padEnd(9)}${cells.join("")}`);
  }
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main(): Promise<void> {
  const limit = parseLimit();
  const registry = makeRegistry();
  const engine = makeEngine(registry, limit);
  const model = createConfiguredModel();

  console.log(`Policy limit: ${limit}`);
  console.log("  result:", await run(model, engine, registry, "Call read_report, then call delete_all_records. If a tool fails, report why."));
  console.log(`  execute() actually ran for: [${executed.join(", ")}]`);

  printPolicyMatrix();
}

await main();


```

## Run

```powershell
npm run stage5 [low|medium|high|critical]


```

Example: `npm run stage5 high`

## Watch for

With limit `medium`, `delete_all_records` (high) is denied by policy, you are never asked, and `executed` stays empty. With `high` it asks `Approve? [y/N]`: `y` runs it, anything else denies it.

## Try it

Run every limit and read the risk x limit matrix.

---

[Previous: Stage 4](./stage4.md) | [Next: Stage 6](./stage6.md) | [Back to README](../README.md)
