import type { ModelAdapter, ModelDecision, ModelMessage, ToolDefinition } from "../types.js";

export interface AzureFoundryConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion?: string;
}

// AgentCore stores assistant turns as JSON'd decisions and tool results without ids; Azure needs tool_calls + tool_call_id pairs.
function toWireMessages(messages: ModelMessage[]) {
  const wire: unknown[] = [];
  let pendingId: string | undefined;
  for (const m of messages) {
    if (m.role === "assistant") {
      try {
        const d = JSON.parse(m.content) as ModelDecision;
        if (d.kind === "tool_call" && d.toolName) {
          pendingId = `call_${wire.length}`;
          wire.push({ role: "assistant", content: null, tool_calls: [{ id: pendingId, type: "function", function: { name: d.toolName, arguments: JSON.stringify(d.input ?? {}) } }] });
          continue;
        }
      } catch { /* plain text assistant turn */ }
      wire.push(m);
    } else if (m.role === "tool") {
      // ponytail: tool failures carry no preceding assistant turn, so they go back as user text
      wire.push(pendingId ? { role: "tool", tool_call_id: pendingId, content: m.content } : { role: "user", content: m.content });
      pendingId = undefined;
    } else wire.push(m);
  }
  return wire;
}

export class AzureFoundryClaudeAdapter implements ModelAdapter {
  readonly id: string;

  constructor(private readonly config: AzureFoundryConfig) {
    this.id = `azure-foundry:${config.deployment}`;
  }

  async decide(messages: ModelMessage[], tools: ToolDefinition[]): Promise<ModelDecision> {
    const url = `${this.config.endpoint.replace(/\/$/, "")}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion ?? "2024-10-21"}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": this.config.apiKey },
      body: JSON.stringify({ messages: toWireMessages(messages), tools: tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } })) })
    });
    if (!response.ok) throw new Error(`Azure Foundry request failed: ${response.status} ${await response.text()}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
    const message = payload.choices?.[0]?.message;
    const call = message?.tool_calls?.[0];
    if (call) return { kind: "tool_call", toolName: call.function.name, input: JSON.parse(call.function.arguments) };
    return { kind: "message", content: message?.content ?? "" };
  }
}

// Future adapters remain deliberately provider-specific and outside Agent Core.
// import { OpenAIAdapter } from "./openai.js";
// import { GeminiAdapter } from "./gemini.js";
// import { AnthropicAdapter } from "./anthropic.js";
