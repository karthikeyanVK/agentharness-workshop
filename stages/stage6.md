# Stage 6: Human Approval Gate

**Question:** When should an allowed action still require consent?

## Learn

Policy asks "may this ever run?". Approval asks "should it run this time?". Approval cannot override a policy denial.

## Setup

- Create a new empty file `src/stage6.ts` in your editor.
- Build it in 5 steps.
- Paste each block exactly as shown, in order.
- Colors come from `src/color.ts`, which already exists.
- `AutoApproveForDemo`, `TerminalApproval` and `ApprovalManager` already exist in `src/approval.ts`.

## Step 1: Imports

Paste at the top of the file.

```ts
// Stage 6: approval. Policy = "may this ever run?"  Approval = "should it run THIS time?"
// Proposed action -> policy allows? -> approval required? -> approved? -> execute
import { AutoApproveForDemo, TerminalApproval, type ApprovalManager } from "./approval.js";
import { ExecutionEngine } from "./engine.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import { cyan, green, red } from "./color.js";
import type { ModelAdapter, ModelMessage, RiskLevel, ToolDefinition } from "./types.js";


```

## Step 2: Two approvers

`AlwaysDeny` is a deterministic deny-all approver.

```ts
class AlwaysDeny implements ApprovalManager {
  async request(): Promise<boolean> { return false; }
}


```

Learner exercise: `ScriptedApproval` answers from a queue. A missing answer means deny.

```ts
class ScriptedApproval implements ApprovalManager {
  constructor(private readonly answers: boolean[]) {}
  async request(tool: ToolDefinition, input: unknown): Promise<boolean> {
    const answer = this.answers.shift() ?? false;
    console.log(`    [approver] ${tool.name}(${JSON.stringify(input)}) -> ${answer ? green("APPROVED") : red("DENIED")}`);
    return answer;
  }
}


```

## Step 3: Simulated tools and registry

From Stage 5, with `executed` passed in so each scenario has its own list. Registry adds a third, critical tool.

```ts
function makeSim(executed: string[]): (name: string, risk: RiskLevel) => ToolDefinition {
  return (name, risk) => ({
    name, risk, description: `Simulated ${risk}-risk action`, permission: "demo", inputSchema: { type: "object", properties: { table: { type: "string" }, week: { type: "number" } } },
    async execute() { executed.push(name); return { ok: true, simulated: name }; },
  });
}


```

```ts
function makeRegistry(sim: (name: string, risk: RiskLevel) => ToolDefinition): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(sim("read_report", "low"));            // below approval threshold
  registry.register(sim("delete_all_records", "high"));    // allowed by policy, needs approval
  registry.register(sim("wipe_production", "critical"));   // above policy limit
  return registry;
}


```

## Step 4: Build the messages and the loop

Same shape as Stage 5. The system prompt now says not to retry denied tools. Paste both.

```ts
function buildMessages(objective: string): ModelMessage[] {
  return [{ role: "system", content: "You are an agent in a harness. Call tools when needed, one at a time. If a tool fails or is denied, do not retry; continue and report. When done, reply with a short final answer and no tool call." }, { role: "user", content: objective }];
}


```

```ts
async function run(model: ModelAdapter, engine: ExecutionEngine, registry: ToolRegistry, objective: string, maxSteps = 10): Promise<void> {
  const messages = buildMessages(objective);
  for (let step = 1; step <= maxSteps; step++) {
    const decision = await model.decide(messages, registry.list());
    if (decision.kind !== "tool_call") { console.log(green(`  model said: ${decision.content}`)); break; }
    messages.push({ role: "assistant", content: JSON.stringify(decision) });
    try {
      messages.push({ role: "tool", content: JSON.stringify(await engine.execute(decision.toolName ?? "", decision.input, objective)) });
    } catch (error) {
      messages.push({ role: "tool", content: `Tool failed: ${(error as Error).message}` });
    }
  }
}


```

## Step 5: Scenarios, entry point and run

One scenario builds a fresh engine with the approver you pass in, runs the objective, then prints the trace.

```ts
async function scenario(model: ModelAdapter, title: string, approver: ApprovalManager, objective: string): Promise<void> {
  console.log(cyan(`\n== ${title} ==`));
  const executed: string[] = [];
  const registry = makeRegistry(makeSim(executed));
  const trace = new Trace();
  const engine = new ExecutionEngine(registry, new PolicyEngine("high"), approver, trace);
  await run(model, engine, registry, objective);
  for (const e of trace.events) console.log(`  trace ${e.type}/${e.status} ${JSON.stringify(e.data)}`);
  console.log(`  execute() actually ran for: [${executed.join(", ")}]`);
}


```

Paste the entry point at the very bottom of the file.

```ts
async function main(): Promise<void> {
  const model = createConfiguredModel();
  const del = "Call delete_all_records with table temp.";

  if (process.argv[2] !== "scripted") {
    // Default: human decides. Low risk skips approval, high asks you, critical is policy-blocked before you are asked.
    await scenario(model, "Clean up the temp table after reading the weekly report", new TerminalApproval(),
      "Call read_report for week 41, then delete_all_records on table temp, then wipe_production.");
    process.exit(0);
  }

  // "scripted" now means scripted APPROVER; the model is still Azure
  await scenario(model, "1. Allowed + approved (AutoApproveForDemo always says yes)", new AutoApproveForDemo(), del);
  await scenario(model, "2. Allowed but denied (AlwaysDeny)", new AlwaysDeny(), del);
  await scenario(model, "3. Policy-blocked: approver never asked", new ScriptedApproval([true]), "Call wipe_production.");
  await scenario(model, "4. Low risk: approver never asked", new ScriptedApproval([]), "Call read_report.");
  await scenario(model, "5. Scripted approver: yes, then no", new ScriptedApproval([true, false]),
    "Call delete_all_records on table temp, then delete_all_records on table customers.");
}

await main();


```

## Run

```powershell
npm run stage6 scripted


```

Example: `npm run stage6` (terminal prompt) or `npm run stage6 scripted` (scripted approvers)

## Watch for

Low risk skips approval. High risk asks first. Critical is policy-blocked before anyone is asked. Denied means the tool never ran.

## Try it

Change the `ScriptedApproval` answers and predict which calls execute.

---

[Previous: Stage 5](./stage5.md) | [Next: Stage 7](./stage7.md) | [Back to README](../README.md)
