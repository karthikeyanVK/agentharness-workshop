# Stage 3: Tool Registry

**Question:** How do we add tools without growing a chain of conditionals in the loop?

## Learn

`ToolRegistry` looks tools up by name. Unknown and duplicate tools are rejected. The loop never names a tool.

## Code

File: [`src/stage3.ts`](../src/stage3.ts). Copy the functions marked `// ---- STAGE 3: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `calculate`, `multiply`, `makeRegistry`, `buildMessages`, `run`, `demoAddThenMultiply`, `demoUnknownTool`, `demoDuplicateRegister`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage3` from the project root, else `.env` is not found.

```powershell
npm run stage3
```

Example: `npm run stage3`

## Watch for

Demo A: add then multiply. Demo B: error for unknown `divide` tool. Demo C: error for duplicate register.

## Try it

Add a third pure tool. The `run` function needs zero changes.

---

[Previous: Stage 2](./stage2.md) | [Next: Stage 4](./stage4.md) | [Back to README](../README.md)
