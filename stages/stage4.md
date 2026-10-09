# Stage 4: Execution Engine

**Question:** Where should execution controls live?

## Learn

Core decides, engine owns how a tool runs. Failures become observations, never fake successes.

## Code

File: [`src/stage4.ts`](../src/stage4.ts). Copy the functions marked `// ---- STAGE 4: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `makeRegistry`, `makeEngine`, `buildMessages`, `run` (calls `engine.execute`), `demoSuccessAndFailure`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage4` from the project root, else `.env` is not found.

```powershell
npm run stage4
```

Example: `npm run stage4`

## Watch for

One tool succeeds. `fetch_exchange_rate` fails with `rate service unreachable` and the model explains the failure.

## Try it

Add another failing tool and make the model complete with an explanation.

---

[Previous: Stage 3](./stage3.md) | [Next: Stage 5](./stage5.md) | [Back to README](../README.md)
