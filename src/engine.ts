import type { ApprovalManager } from "./approval.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";

export class ExecutionEngine {
  constructor(private readonly registry: ToolRegistry, private readonly policy: PolicyEngine, private readonly approvals: ApprovalManager, private readonly trace: Trace) {}

  async execute(name: string, input: unknown, objective: string): Promise<unknown> {
    const tool = this.registry.get(name);
    const decision = this.policy.authorize(tool);
    if (!decision.allowed) throw new Error(decision.reason);
    if (decision.requiresApproval) {
      this.trace.record("approval", "awaiting_approval", { tool: name, input });
      if (!(await this.approvals.request(tool, input, objective))) throw new Error(`Approval denied for ${name}`);
    }
    this.trace.record("tool", "running", { tool: name, input });
    try {
      const result = await tool.execute(input, { objective, signal: AbortSignal.timeout(30_000) });
      this.trace.record("tool", "succeeded", { tool: name, result });
      return result;
    } catch (error) {
      this.trace.record("tool", "failed", { tool: name, error: String(error) });
      throw error;
    }
  }
}
