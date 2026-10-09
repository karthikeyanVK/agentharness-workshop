export type JsonSchema = Record<string, unknown>;

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ActionStatus = "planned" | "awaiting_approval" | "running" | "succeeded" | "failed";

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  permission: string;
  risk: RiskLevel;
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
}

export interface ToolExecutionContext {
  objective: string;
  signal: AbortSignal;
}

export interface ModelMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ModelDecision {
  kind: "tool_call" | "complete" | "message";
  toolName?: string;
  input?: unknown;
  content?: string;
  reasoning?: string;
}

export interface ModelAdapter {
  readonly id: string;
  decide(messages: ModelMessage[], tools: ToolDefinition[]): Promise<ModelDecision>;
}
