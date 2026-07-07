import type { LlmAdapter, LlmRequest, LlmResponse, ModelInfo } from "../types";

type FetchLike = typeof fetch;

export class OllamaAdapter implements LlmAdapter {
  id = "ollama" as const;
  isLocal = true;

  constructor(
    private readonly baseUrl = "http://localhost:11434",
    private readonly model = "llama3.1:8b",
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: req.model ?? this.model, prompt: req.prompt, stream: false })
    });
    if (!response.ok) throw new Error(`Ollama request failed: ${response.status}`);
    const data = (await response.json()) as { response?: string; model?: string };
    return {
      text: data.response ?? "",
      model: data.model ?? req.model ?? this.model,
      local: true,
      raw: data
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/tags`);
    if (!response.ok) throw new Error(`Ollama tags failed: ${response.status}`);
    const data = (await response.json()) as {
      models?: Array<{ name: string; size?: number; modified_at?: string; details?: { family?: string } }>;
    };
    return (data.models ?? []).map((model) => ({
      name: model.name,
      size: model.size,
      modifiedAt: model.modified_at,
      family: model.details?.family
    }));
  }
}

export class LmStudioAdapter implements LlmAdapter {
  id = "lmstudio" as const;
  isLocal = true;

  constructor(
    private readonly baseUrl = "http://localhost:1234",
    private readonly model = "local-model",
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: req.model ?? this.model,
        messages: [{ role: "user", content: req.prompt }],
        temperature: req.temperature ?? 0.2
      })
    });
    if (!response.ok) throw new Error(`LM Studio request failed: ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      model: data.model ?? req.model ?? this.model,
      local: true,
      raw: data
    };
  }
}
