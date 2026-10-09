# Stage 8: Traces And Observability

**Question:** How can we explain what the harness actually did?

## Learn

Output answers the task, memory retains outcomes, trace explains execution.

## Code

File: [`src/stage8.ts`](../src/stage8.ts). Copy the functions marked `// ---- STAGE 8: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `tool`, `makeRegistry`, `runAgent`, `narrate`, `printTrace`, `printSurfaces`, `printWipeExercise`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage8` from the project root, else `.env` is not found.

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
