# Prompt: build a shareable Electron installer

Paste everything below the line into a Claude Code session (or the WebUI) opened at the repo root.

Notes before sharing the result:
- Unsigned Windows installers trigger SmartScreen warnings. Only a code-signing certificate fixes that; the prompt does not cover it.
- Each person needs their own Azure key, which is why requirement 5 asks for a settings screen instead of bundling one.

---

Context: this repo is a TypeScript agent harness (src/), an Express+SSE server (server/), a Vite+React UI (web/) and a dev-only Electron shell (electron/). Read ARCHITECTURE.md and CLAUDE.md first and follow CLAUDE.md. Do not change the behavior of src/, server/ or web/ except where this prompt says so. Keep the existing electron/ dev flow working.

Goal: produce a shareable desktop installer for Windows (NSIS .exe plus a portable .exe) that a non-developer can double-click, with no Node, npm, repo or tsx installed. Add it as a new folder `desktop/` with its own package.json, using electron-builder.

## Requirements

1. **Bundle the server.** Use esbuild to bundle server/index.ts (and the src/ code it imports, including the `typescript` package that execute_typescript uses) into one file. No tsx at runtime. Bundle the built web/dist as static assets.
2. **Run the server inside the packaged app** (in the Electron main process, or as a child using ELECTRON_RUN_AS_NODE=1) on a free localhost port. Remove the hard-coded 8787 for the packaged build: the server takes its port from env, and the UI learns the API base at runtime (for example via a preload-exposed value or a config endpoint), without breaking `npm run web` and `npm run server` in dev.
3. **Generated-code sandbox.** src/enterprise-marketing-agent-harness.ts runs model code via `execFile(process.execPath, ["--permission", ...], { env: {} })`. In a packaged Electron app `process.execPath` is the Electron binary, and an empty env makes it launch the GUI instead of running the script. Fix this minimally, for example by passing ELECTRON_RUN_AS_NODE=1 in the child env only. Keep the rest of the sandbox unchanged (the --permission flags, read/write fences, 25 s timeout, 1 MB buffer). Confirm the Node version inside Electron supports --permission and every flag used. If not, say so and propose an alternative.
4. **Writable data.** A packaged app cannot write inside its install directory. Seed workspace/ (the input CSVs) into `app.getPath("userData")/workspace` on first run, and make the harness use that path through an env var or option, defaulting to `./workspace` so the dev flow is unchanged. working/ and output/ are recreated per run.
5. **Secrets.** NEVER bundle .env or any API key into the installer. Add a first-run settings screen or dialog that asks for AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY, AZURE_FOUNDRY_DEPLOYMENT and AZURE_FOUNDRY_API_VERSION. Store the key with Electron safeStorage in userData, inject the values into the server environment, and provide a way to re-open settings. Make sure the electron-builder `files` config excludes .env, node_modules/.cache, workspace/working and workspace/output.
6. **Lifecycle.** Kill the server on app quit, even on a force close. Single-instance lock. If the server fails to start or the key is missing, show a clear error dialog instead of a blank window.
7. **Security.** contextIsolation on, nodeIntegration off, sandbox on, external links open in the default browser, serve the UI only on 127.0.0.1.
8. **Scripts** in desktop/package.json: `build:web`, `bundle:server`, `dist` (builds the installer into desktop/release/) and `start` (runs the packaged-style app unpackaged for quick testing). Add desktop/release/ and desktop/build/ to .gitignore.

## Validation

Do all of it and report real results, not assumptions.

- Run `npm run dist`, then launch the produced exe from a clean folder with no repo, no .env, and no Node on PATH.
- Complete first-run settings, run the default request with Auto-approve, and confirm execute_typescript really succeeds (exit 0, report written to output/) and the summary table renders. Drive it over the Chrome DevTools Protocol (--remote-debugging-port) or a screenshot, because a server health check alone is not enough.
- Run it again without Auto-approve and confirm Approve and Deny both work.
- Close the window mid-approval and confirm no orphan node/electron processes remain and a new launch works.
- Confirm the installer contains no API key (search the unpacked app.asar for the key and for .env).
- Check for zero-byte files per CLAUDE.md.

Report the installer size, the Node version inside Electron, and anything you could not verify. Do not commit unless I ask.
