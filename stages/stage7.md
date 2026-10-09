# Stage 7: Context And Memory

**Question:** What is the current task, and what has already happened?

## Learn

Context = the task (`ContextManager`). Conversation = model input inside one run. Memory = retained outcomes. Storing information is not giving it to the model.

## Code

File: [`src/stage7.ts`](../src/stage7.ts). Copy the functions marked `// ---- STAGE 7: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `makeRegistry`, `spyModel`, `makeCore`, `demoRun1`, `demoRun2`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage7` from the project root, else `.env` is not found.

```powershell
npm run stage7
```

Example: `npm run stage7`

## Watch for

`spyModel` prints exactly what the LLM saw. Run 2 sees memory from run 1 only because it is shared.

## Try it

Use a fresh `Memory` for run 2 and predict the answer.

---

[Previous: Stage 6](./stage6.md) | [Next: Stage 8](./stage8.md) | [Back to README](../README.md)
