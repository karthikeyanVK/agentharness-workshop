import { createInterface } from "node:readline/promises";
import type { ToolDefinition } from "./types.js";

export interface ApprovalManager { request(tool: ToolDefinition, input: unknown, objective?: string): Promise<boolean>; }

export class AutoApproveForDemo implements ApprovalManager {
  async request(): Promise<boolean> { return true; }
}

// Asks the human at the terminal. Only "y"/"yes" approves; empty answer or closed stdin denies.
export class TerminalApproval implements ApprovalManager {
  async request(tool: ToolDefinition, input: unknown, objective?: string): Promise<boolean> {
    console.log(["", "  +-- APPROVAL REQUIRED ------------------------", `  | Task:  ${objective ?? "(unknown)"}`, `  | Tool:  ${tool.name} - ${tool.description}`, `  | Risk:  ${tool.risk}`, `  | Input: ${JSON.stringify(input)}`, "  +---------------------------------------------"].join("\n"));
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const answer = await new Promise<string>((resolve) => {
        rl.once("close", () => resolve(""));
        rl.question("  Approve? [y/N] ").then(resolve, () => resolve(""));
      });
      const approved = /^y(es)?$/i.test(answer.trim());
      console.log(`  -> ${approved ? "APPROVED" : "DENIED"} by user\n`);
      return approved;
    } finally {
      rl.close();
    }
  }
}
