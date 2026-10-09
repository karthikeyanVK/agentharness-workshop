# Stage 8: Traces And Observability

**Question:** How can we explain what the harness actually did?

## Learn

Output answers the task, memory retains outcomes, trace explains execution.

## Code

File: [`src/stage8.ts`](../src/stage8.ts). Copy the functions marked `// ---- STAGE 8: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `tool`, `makeRegistry`, `runAgent`, `narrate`, `printTrace`, `printSurfaces`, `printWipeExercise`, `main`

## Run

Needs `AZURE_FOUNDRY_*` in `.env` (see README).

```powershell
npm run stage8
```

Example: `npm run stage8`

## Watch for

Trace printed in order with sentences from `narrate`, then output vs memory vs trace side by side.

## Try it

Query the trace to answer: did `wipe_production` ever execute?

---

[Previous: Stage 7](./stage7.md) | [Back to README](../README.md)
