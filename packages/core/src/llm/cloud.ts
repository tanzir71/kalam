import type { LlmAdapter, LlmRequest, LlmResponse } from "../types";

type FetchLike = typeof fetch;

export class OpenAiAdapter implements LlmAdapter {
  id = "openai" as const;
  isLocal = false;

  constructor(
    private readonly apiKey: string,
    private readonly cloudEnabled: boolean,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly model = "gpt-4o-mini"
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    this.assertCloudEnabled();
    const response = await this.fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: req.model ?? this.model,
        messages: [{ role: "user", content: req.prompt }],
        temperature: req.temperature ?? 0.2
      })
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      model: data.model ?? req.model ?? this.model,
      local: false,
      raw: data
    };
  }

  private assertCloudEnabled(): void {
    if (!this.cloudEnabled || !this.apiKey) {
      throw new Error("Cloud AI is disabled. Enable cloud and provide a BYO API key first.");
    }
  }
}

export class AnthropicAdapter implements LlmAdapter {
  id = "anthropic" as const;
  isLocal = false;

  constructor(
    private readonly apiKey: string,
    private readonly cloudEnabled: boolean,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly model = "claude-3-5-haiku-latest"
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    this.assertCloudEnabled();
    const response = await this.fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: req.model ?? this.model,
        max_tokens: 2048,
        messages: [{ role: "user", content: req.prompt }]
      })
    });
    if (!response.ok) throw new Error(`Anthropic request failed: ${response.status}`);
    const data = (await response.json()) as { content?: Array<{ text?: string }>; model?: string };
    return {
      text: data.content?.map((part) => part.text ?? "").join("") ?? "",
      model: data.model ?? req.model ?? this.model,
      local: false,
      raw: data
    };
  }

  private assertCloudEnabled(): void {
    if (!this.cloudEnabled || !this.apiKey) {
      throw new Error("Cloud AI is disabled. Enable cloud and provide a BYO API key first.");
    }
  }
}
