import { describe, expect, it, vi } from "vitest";
import {
  AnthropicAdapter,
  MockAdapter,
  OllamaAdapter,
  OpenAiAdapter,
  RuleAdapter,
  defaultSettings,
  hasMeaningfulDiff,
  resolveAdapter,
  rewrite
} from "../src";

describe("LLM adapters", () => {
  it("guards cloud adapters when cloud is disabled", async () => {
    await expect(new OpenAiAdapter("", false).complete({ text: "x", prompt: "x" })).rejects.toThrow(/disabled/i);
    await expect(new AnthropicAdapter("", false).complete({ text: "x", prompt: "x" })).rejects.toThrow(/disabled/i);
  });

  it("falls through to RuleAdapter when local runtimes are not reachable", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const adapter = await resolveAdapter(defaultSettings, { fetchImpl, timeoutMs: 1 });
    expect(adapter).toBeInstanceOf(RuleAdapter);
  });

  it("parses Ollama tag fixtures", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ models: [{ name: "llama3.1:8b", size: 42 }] })) as unknown as
      typeof fetch;
    const models = await new OllamaAdapter("http://localhost:11434", "llama3.1:8b", fetchImpl).listModels();
    expect(models).toEqual([{ name: "llama3.1:8b", size: 42, modifiedAt: undefined, family: undefined }]);
  });
});

describe("rewrite", () => {
  it("returns transformed text and a valid diff with MockAdapter", async () => {
    const result = await rewrite(new MockAdapter(), {
      text: "It is important to note that teh writing is very clear.",
      goal: "improve"
    });
    expect(result.text).toContain("the writing");
    expect(hasMeaningfulDiff(result.diff)).toBe(true);
    expect(result.meta.local).toBe(true);
  });

  it("RuleAdapter provides meaningful no-AI rewrites for every goal", async () => {
    const adapter = new RuleAdapter();
    const goals = ["improve", "shorten", "expand", "formal", "casual", "confident", "simplify", "humanize"] as const;
    for (const goal of goals) {
      const result = await rewrite(adapter, {
        text: "Moreover, it is important to note that we do not utilize very complex wording.",
        goal
      });
      expect(result.text).not.toBe("Moreover, it is important to note that we do not utilize very complex wording.");
    }
  });
});
