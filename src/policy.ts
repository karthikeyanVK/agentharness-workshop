import type { RiskLevel, ToolDefinition } from "./types.js";

const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export class PolicyEngine {
  constructor(private readonly maximumRisk: RiskLevel = "medium") {}

  authorize(tool: ToolDefinition): { allowed: boolean; requiresApproval: boolean; reason?: string } {
    if (rank[tool.risk] > rank[this.maximumRisk]) return { allowed: false, requiresApproval: false, reason: `Risk ${tool.risk} exceeds policy limit` };
    return { allowed: true, requiresApproval: rank[tool.risk] >= rank.high };
  }
}
