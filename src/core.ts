import type { ModelAdapter, ModelMessage } from "./types.js";
import { ContextManager } from "./context.js";
import { ExecutionEngine } from "./engine.js";
import { Memory } from "./memory.js";
import { ToolRegistry } from "./registry.js";
import { Trace } from "./trace.js";

export class AgentCore {
  constructor(private readonly model: ModelAdapter, private readonly registry: ToolRegistry, private readonly engine: ExecutionEngine, private readonly context: ContextManager, private readonly memory: Memory, readonly trace: Trace) {}

  async run(maxSteps = 10): Promise<string> {
    const messages: ModelMessage[] = [{ role: "system", content: "You are an agent. Choose tools through the harness and stop only when complete." }, { role: "user", content: this.context.objective }];
    for (let step = 0; step < maxSteps; step++) {
      const decision = await this.model.decide(messages, this.registry.list());
      this.trace.record("decision", "planned", decision);
      if (decision.kind === "complete" || decision.kind === "message") return decision.content ?? "";
      if (decision.kind !== "tool_call" || !decision.toolName) throw new Error("Model returned an invalid tool decision");
      try {
        const result = await this.engine.execute(decision.toolName, decision.input, this.context.objective);
        const content = JSON.stringify(result);
        this.memory.remember(content);
        messages.push({ role: "assistant", content: JSON.stringify(decision) }, { role: "tool", content });
      } catch (error) {
        const content = `Tool failed: ${String(error)}`;
        this.memory.remember(content);
        messages.push({ role: "tool", content });
      }
    }
    throw new Error("Agent stopped after reaching the maximum step count");
  }
}
