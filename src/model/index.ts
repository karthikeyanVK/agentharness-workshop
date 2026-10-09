import "dotenv/config";
import { AzureFoundryClaudeAdapter } from "./azure-foundry.js";
import type { ModelAdapter } from "../types.js";

export function createConfiguredModel(env: NodeJS.ProcessEnv = process.env): ModelAdapter {
  const endpoint = env.AZURE_FOUNDRY_ENDPOINT;
  const apiKey = env.AZURE_FOUNDRY_API_KEY;
  if (!endpoint || !apiKey) throw new Error("Azure Foundry configuration is required: AZURE_FOUNDRY_ENDPOINT and AZURE_FOUNDRY_API_KEY");
  return new AzureFoundryClaudeAdapter({
    endpoint,
    apiKey,
    deployment: env.AZURE_FOUNDRY_DEPLOYMENT ?? "claude-opus-5",
    apiVersion: env.AZURE_FOUNDRY_API_VERSION
  });
}

// Provider switching belongs here, not in AgentCore.
// Future configuration branches can return OpenAI, Gemini, or Anthropic adapters.
