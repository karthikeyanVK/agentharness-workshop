# Stage 5: Policy Before Execution

**Question:** Should every proposed action be allowed?

## Learn

A model requesting a tool is not authorization. `PolicyEngine` compares tool risk to a limit before execution.

## Code

File: [`src/stage5.ts`](../src/stage5.ts). Copy the functions marked `// ---- STAGE 5: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `parseLimit`, `sim`, `makeRegistry`, `makeEngine`, `buildMessages`, `run`, `printPolicyMatrix`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage5` from the project root, else `.env` is not found.

```powershell
npm run stage5 [low|medium|high|critical]
```

Example: `npm run stage5 high`

## Watch for

With limit `medium`, `delete_all_records` (high) is denied and `executed` stays empty. With `high` it runs.

## Try it

Run every limit and read the risk x limit matrix.

---

[Previous: Stage 4](./stage4.md) | [Next: Stage 6](./stage6.md) | [Back to README](../README.md)
