import { readFile } from "node:fs/promises";
import { extname, resolve, relative } from "node:path";
import type { ToolDefinition } from "../types.js";

export interface LocalFileInput { path: string; }

export function createLocalFileTool(workspaceRoot: string): ToolDefinition<LocalFileInput> {
  return {
    name: "read_local_file",
    description: "Read a CSV, JSON, or Markdown file inside the configured workspace.",
    inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    permission: "local_file.read",
    risk: "low",
    async execute(input) {
      const root = resolve(workspaceRoot);
      const target = resolve(root, input.path);
      const pathFromRoot = relative(root, target);
      if (pathFromRoot.startsWith("..") || pathFromRoot.includes(":") || pathFromRoot.startsWith("\\")) throw new Error("File path must remain inside the workspace");
      const extension = extname(target).toLowerCase();
      if (![".csv", ".json", ".md", ".markdown"].includes(extension)) throw new Error(`Unsupported local file type: ${extension}`);
      const content = await readFile(target, "utf8");
      if (extension === ".json") return { path: input.path, type: "json", content: JSON.parse(content) };
      return { path: input.path, type: extension === ".csv" ? "csv" : "markdown", content };
    }
  };
}
