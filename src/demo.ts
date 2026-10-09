import { AutoApproveForDemo } from "./approval.js";
import { AgentCore } from "./core.js";
import { ContextManager } from "./context.js";
import { ExecutionEngine } from "./engine.js";
import { Memory } from "./memory.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";
import type { ModelAdapter, ModelDecision } from "./types.js";

class DemoModel implements ModelAdapter {
  readonly id = "demo-model";
  private called = false;
  async decide(): Promise<ModelDecision> {
    if (!this.called) { this.called = true; return { kind: "tool_call", toolName: "calculate", input: { left: 21, right: 21 } }; }
    return { kind: "complete", content: "Objective complete." };
  }
}

const registry = new ToolRegistry();
registry.register({ name: "calculate", description: "Add two numbers", inputSchema: { type: "object", properties: { left: { type: "number" }, right: { type: "number" } }, required: ["left", "right"] }, permission: "calculation", risk: "low", async execute(input) { const values = input as { left: number; right: number }; return { value: values.left + values.right }; } });
const trace = new Trace();
const agent = new AgentCore(new DemoModel(), registry, new ExecutionEngine(registry, new PolicyEngine(), new AutoApproveForDemo(), trace), new ContextManager("Validate the harness control loop"), new Memory(), trace);
console.log(await agent.run());
console.log(JSON.stringify(trace.events, null, 2));
