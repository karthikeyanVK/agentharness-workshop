# Stage 6: Human Approval Gate

**Question:** When should an allowed action still require consent?

## Learn

Policy asks "may this ever run?". Approval asks "should it run this time?". Approval cannot override a policy denial.

## Code

File: [`src/stage6.ts`](../src/stage6.ts). Copy the functions marked `// ---- STAGE 6: ... (copy this) ----`. Functions marked `from STAGE M` came from an earlier stage.

Functions: `AlwaysDeny`, `ScriptedApproval`, `makeSim`, `makeRegistry`, `buildMessages`, `run`, `scenario`, `main`

## Run

Needs a `.env` in the project root: copy `.env.example` to `.env` and paste the API key after `AZURE_FOUNDRY_API_KEY=` (see README). Run `npm run stage6` from the project root, else `.env` is not found.

```powershell
npm run stage6 [scripted]
```

Example: `npm run stage6` (terminal prompt) or `npm run stage6 scripted` (scripted approvers)

## Watch for

Low risk skips approval. High risk asks first. Critical is policy-blocked before anyone is asked. Denied means the tool never ran.

## Try it

Change the `ScriptedApproval` answers and predict which calls execute.

---

[Previous: Stage 5](./stage5.md) | [Next: Stage 7](./stage7.md) | [Back to README](../README.md)
