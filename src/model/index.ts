import "dotenv/config";
import { AzureFoundryClaudeAdapter } from "./azure-foundry.js";
import type { ModelAdapter } from "../types.js";

export function createConfiguredModel(env: NodeJS.ProcessEnv = process.env): ModelAdapter {
  const endpoint = env.AZURE_FOUNDRY_ENDPOINT;
  const apiKey = env.AZURE_FOUNDRY_API_KEY;
  if (!endpoint || !apiKey) {
    const missing = [!endpoint && "AZURE_FOUNDRY_ENDPOINT", !apiKey && "AZURE_FOUNDRY_API_KEY"].filter(Boolean).join(", ");
    throw new Error(`Missing ${missing}. Copy .env.example to .env in ${process.cwd()}, paste the API key after AZURE_FOUNDRY_API_KEY=, then rerun.`);
  }
  return new AzureFoundryClaudeAdapter({
    endpoint,
    apiKey,
    deployment: env.AZURE_FOUNDRY_DEPLOYMENT ?? "claude-opus-5",
    apiVersion: env.AZURE_FOUNDRY_API_VERSION
  });
}

// Provider switching belongs here, not in AgentCore.
// Future configuration branches can return OpenAI, Gemini, or Anthropic adapters.
