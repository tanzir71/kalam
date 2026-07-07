import type { LlmAdapter } from "../types";
import type { Settings } from "../settings/schema";
import { AnthropicAdapter, OpenAiAdapter } from "./cloud";
import { LmStudioAdapter, OllamaAdapter } from "./local";
import { RuleAdapter } from "./rule";

type FetchLike = typeof fetch;

export interface ResolveAdapterOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

export async function resolveAdapter(
  settings: Settings,
  options: ResolveAdapterOptions = {}
): Promise<LlmAdapter> {
  const fetchImpl = options.fetchImpl ?? fetch;

  if (settings.cloud.enabled && settings.cloud.apiKey && settings.backend === "cloud") {
    return settings.cloud.provider === "anthropic"
      ? new AnthropicAdapter(settings.cloud.apiKey, true, fetchImpl)
      : new OpenAiAdapter(settings.cloud.apiKey, true, fetchImpl);
  }

  if (settings.backend !== "noai") {
    if (await canReach(`${settings.local.ollamaUrl}/api/tags`, fetchImpl, options.timeoutMs)) {
      return new OllamaAdapter(settings.local.ollamaUrl, settings.models.rewrite, fetchImpl);
    }
    if (await canReach(`${settings.local.lmStudioUrl}/v1/models`, fetchImpl, options.timeoutMs)) {
      return new LmStudioAdapter(settings.local.lmStudioUrl, settings.models.rewrite, fetchImpl);
    }
  }

  return new RuleAdapter();
}

async function canReach(url: string, fetchImpl: FetchLike, timeoutMs = 250): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
