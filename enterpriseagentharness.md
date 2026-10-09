# Enterprise Agent Harness - Marketing

**Question:** What can you build for your company today with the harness basics you've learned, and what tips and tricks make it safe to run?

## Learn

The model does not guess numbers. It writes TypeScript, the harness runs it in a fenced workspace, the model reads the result back, then answers. Runtime execution is just more tools: `AgentCore` from Stages 1-8 does not change.

## Setup

Create a new empty file `src/enterprise-marketing-agent-harness.ts` in your editor. Build it in 9 steps. Paste each block exactly as shown, in order. 

## Step 0: Imports

Paste at the top of the file.
```ts
// Enterprise Marketing Agent Harness: the model writes code, the harness runs it in a fenced workspace, the model checks the result.
import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { AutoApproveForDemo } from "./approval.js";
import { ContextManager } from "./context.js";
import { AgentCore } from "./core.js";
import { ExecutionEngine } from "./engine.js";
import { Memory } from "./memory.js";
import { PolicyEngine } from "./policy.js";
import { ToolRegistry } from "./registry.js";
import { Trace, type TraceEvent } from "./trace.js";
import { createConfiguredModel } from "./model/index.js";
import { cyan, green, red, yellow } from "./color.js";
import type { ModelAdapter, RiskLevel, ToolDefinition } from "./types.js";


```
## Step 1: Request and workspace paths

Where the request comes from and where the fenced workspace lives. Everything the agent touches is under `workspace/`.

```ts
const REQUEST = process.argv[2] ?? "Analyze the ShopKart marketing campaigns, identify campaigns with declining ROI, and create a management report.";
const ROOT = resolve("workspace");
const ZONES = ["input", "working", "output"];


```

## Step 2: Guidance, injected as an extra system message

Rules for the model, injected as an extra system message. `withGuidance` wraps any model, so `AgentCore` does not change.

```ts
const GUIDANCE = [
  "You analyze marketing data by writing TypeScript, never by estimating numbers yourself.",
  "Rules:",
  "1. Call list_workspace_files, then inspect_csv_file on each CSV BEFORE writing code.",
  "2. Compute with execute_typescript. The code runs with cwd = workspace, so read 'input/<name>.csv' and write 'output/<name>'. Use only node:fs and node:path. Parse CSV with split('\\n') and split(',').",
  "3. Weekly ROI = (revenue - spend) / spend. Revenue counts completed orders only, grouped into the same week_start (Monday) buckets as marketing_spend.csv by order_date. A campaign is declining if ROI falls week over week in the last three weeks.",
  "4. Write the report to output/management_report.md and the numbers to output/campaign_metrics.json.",
  "5. Read the report back with read_workspace_file, then give the final answer as a management summary: one line per campaign, starting with exactly [DECLINING] (ROI falling), [WATCH] (ROI negative but not falling) or [HEALTHY] (ROI positive and not falling), then the campaign name, channel and ROI trend. End with one recommendation line.",
].join("\n");


```

```ts
// Wraps any model: AgentCore stays untouched.
function withGuidance(model: ModelAdapter): ModelAdapter {
  return { id: model.id, decide: (messages, tools) => model.decide([messages[0], { role: "system", content: GUIDANCE }, ...messages.slice(1)], tools) };
}


```

## Step 3: The fence. Every tool resolves paths through here

The fence. Every tool resolves paths through `safePath`, so nothing outside `input/ working/ output/` is reachable.

```ts
function safePath(relativePath: string): string {
  const target = resolve(ROOT, relativePath);
  const inside = relative(ROOT, target);
  if (inside.startsWith("..") || !ZONES.includes(inside.split(sep)[0])) throw new Error(`Path must stay inside ${ZONES.join("/ ")}/: ${relativePath}`);
  return target;
}


```

## Step 4: Tool helper

Same helper as Stage 8. Keeps tool definitions short.

```ts
const tool = (name: string, risk: RiskLevel, description: string, properties: Record<string, unknown>, execute: ToolDefinition["execute"]): ToolDefinition =>
  ({ name, risk, description, permission: "workspace", inputSchema: { type: "object", properties }, execute });


```

## Step 5: Tool functions

The tool bodies. `executeTypescript` is the lesson: validate, transpile, run in a child process under `node --permission` with an empty environment, return stdout, stderr, exit code and new files.

```ts
// List every file in input/, working/ and output/ as "zone/name".
async function listWorkspaceFiles(): Promise<string[]> {
  const files: string[] = [];
  for (const zone of ZONES) for (const name of await readdir(join(ROOT, zone))) files.push(`${zone}/${name}`);
  return files;
}

// Show a CSV's columns, row count and 3 sample rows so the model can plan its code before writing any.
async function inspectCsvFile(path: string): Promise<unknown> {
  const [header, ...rows] = (await readFile(safePath(path), "utf8")).trim().split("\n"); // ponytail: naive split, no quoted commas
  return { path, columns: header.split(","), rowCount: rows.length, sampleRows: rows.slice(0, 3) };
}

// Read a text-like file back (capped at 20k chars). Only .md .csv .json .txt are allowed.
async function readWorkspaceFile(path: string): Promise<string> {
  if (![".md", ".csv", ".json", ".txt"].includes(extname(path).toLowerCase())) throw new Error(`Unsupported file type: ${extname(path)}`);
  return (await readFile(safePath(path), "utf8")).slice(0, 20_000);
}


```

```ts
let runCount = 0;


```

```ts
function runChild(file: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  // node --permission: file access only inside the workspace, writes only to working/ and output/, empty env so no API keys leak.
  const args = ["--permission", `--allow-fs-read=${ROOT}`, `--allow-fs-write=${join(ROOT, "working")}`, `--allow-fs-write=${join(ROOT, "output")}`, file];
  return new Promise((done) => execFile(process.execPath, args, { cwd: ROOT, env: {}, timeout: 25_000, maxBuffer: 1_000_000 }, (error, stdout, stderr) =>
    done({ exitCode: error ? (typeof error.code === "number" ? error.code : 1) : 0, stdout: stdout.slice(0, 8000), stderr: error?.killed ? "Timed out after 25 s" : stderr.slice(0, 4000) })));
}


```

```ts
async function executeTypescript(code: string): Promise<unknown> {
  if (!code.trim() || code.length > 20_000) throw new Error("Code must be 1-20000 characters");
  const run = `run-${++runCount}`;
  const before = await listWorkspaceFiles();
  await writeFile(join(ROOT, "working", `${run}.ts`), code); // saved for audit: you can see HOW the number was produced
  const script = join(ROOT, "working", `${run}.mjs`);
  await writeFile(script, ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText); // ponytail: transpiled, not type-checked
  const started = Date.now();
  const result = await runChild(script);
  return { ...result, durationMs: Date.now() - started, newFiles: (await listWorkspaceFiles()).filter((f) => !before.includes(f)) };
}


```

## Step 6: Register the four tools

Four tools. `execute_typescript` is risk `medium`: the policy allows it and approval is auto-granted for the demo.

```ts
function makeRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(tool("list_workspace_files", "low", "List files in input/, working/ and output/", {}, () => listWorkspaceFiles()));
  registry.register(tool("inspect_csv_file", "low", "Show columns, row count and 3 sample rows of a CSV in the workspace", { path: { type: "string" } }, (input) => inspectCsvFile((input as { path: string }).path)));
  registry.register(tool("execute_typescript", "medium", "Run TypeScript in the workspace (cwd = workspace). Returns stdout, stderr, exit code and new files.", { code: { type: "string" } }, (input) => executeTypescript((input as { code: string }).code)));
  registry.register(tool("read_workspace_file", "low", "Read a .md, .csv, .json or .txt file from the workspace", { path: { type: "string" } }, (input) => readWorkspaceFile((input as { path: string }).path)));
  return registry;
}


```

## Step 7: Live, phase-labelled trace

Turns trace events into a live, phase-labelled printout (what the audience watches) and color-codes the final management summary: red `[DECLINING]`, yellow `[WATCH]`, green `[HEALTHY]`.

```ts
function describe(e: TraceEvent): [string, string, (s: string) => string] | undefined {
  const d = e.data as Record<string, any>;
  if (e.type === "decision") return d.kind === "tool_call" ? ["AGENT REASONING", `model chose ${d.toolName}`, cyan] : undefined;
  if (e.status === "awaiting_approval") return ["APPROVAL", `waiting for ${d.tool}`, yellow];
  if (e.status === "failed") return ["TOOL FAILED", `${d.tool}: ${d.error}`, red];
  if (e.status === "running") return [d.tool === "execute_typescript" ? "TYPESCRIPT EXECUTION" : d.tool === "read_workspace_file" ? "AGENT INSPECTION" : "FILE ACCESS", d.tool === "execute_typescript" ? "running generated code" : `${d.tool} ${JSON.stringify(d.input)}`, cyan];
  if (d.tool === "execute_typescript") return ["RESULT", `exit ${d.result.exitCode} in ${d.result.durationMs} ms${d.result.newFiles.length ? ` | REPORT GENERATION: ${d.result.newFiles.join(", ")}` : ""}`, d.result.exitCode === 0 ? green : red];
  return undefined;
}


```

```ts
// Print each trace event live, in its phase color.
function attachLiveTrace(trace: Trace): void {
  trace.onEvent = (e) => { const line = describe(e); if (line) console.log(line[2](`  ${line[0].padEnd(22)} ${line[1]}`)); };
}

// Status tag -> color. The tags match what the guidance tells the model to start each line with.
const TAG_COLORS: Record<string, (s: string) => string> = { "[DECLINING]": red, "[WATCH]": yellow, "[HEALTHY]": green };

// Color each summary line by its leading tag, headings cyan, everything else plain.
function colorSummary(text: string): string {
  return text.split("\n").map((line) => {
    const bare = line.replace(/^[\s*-]+/, ""); // models like to add "- " bullets
    const tag = Object.keys(TAG_COLORS).find((t) => bare.startsWith(t));
    return tag ? TAG_COLORS[tag](line) : /^#/.test(line.trim()) ? cyan(line) : line;
  }).join("\n");
}


```

## Step 8: Main

Reset `working/` and `output/` (the ShopKart CSV files already sit in `workspace/input/`), wire the Stage 1-7 harness (core, engine, policy, registry, trace) around the new tools and run.

```ts
async function main(): Promise<void> {
  for (const zone of ZONES) { if (zone !== "input") await rm(join(ROOT, zone), { recursive: true, force: true }); await mkdir(join(ROOT, zone), { recursive: true }); } // fresh working/ and output/ each run; input/ holds the committed CSVs
  const registry = makeRegistry();
  const trace = new Trace();
  attachLiveTrace(trace);
  const engine = new ExecutionEngine(registry, new PolicyEngine("medium"), new AutoApproveForDemo(), trace); // execute_typescript is medium: allowed
  const agent = new AgentCore(withGuidance(createConfiguredModel()), registry, engine, new ContextManager(REQUEST), new Memory(), trace);
  console.log(cyan(`  ${"USER REQUEST".padEnd(22)} ${REQUEST}`));
  const answer = await agent.run(15);
  console.log(cyan("\n  MANAGEMENT SUMMARY"));
  console.log(colorSummary(answer));
}


```

```ts
await main();


```

## Run

```powershell

npm run enterprise-marketing-agent-harness -- "Which channel has the best ROI? Output a CSV."


```

## Watch for

Phases in order: USER REQUEST, AGENT REASONING, FILE ACCESS, TYPESCRIPT EXECUTION, RESULT, REPORT GENERATION, AGENT INSPECTION, FINAL ANSWER. Expected finding: **C02 Instagram Reels Festive** and **C04 Facebook Retargeting** have falling ROI.

Open `workspace/working/run-1.ts` to see the code the model wrote, and `workspace/output/management_report.md` for the report.

## Try it

Change `PolicyEngine("medium")` to `PolicyEngine("low")` in `main`. `execute_typescript` is now blocked: "Risk medium exceeds policy limit".

## Safety model

- Paths resolve only inside `input/ working/ output/`.
- The child runs `node --permission`: reads limited to the workspace, writes limited to `working/` and `output/`.
- The child environment is empty, so API keys never reach generated code.
- 25 s timeout, output capped, code size capped.
- Honest gap: Node permission mode does not block network access. Production needs a container or VM.

---

[Back to README](./README.md)
