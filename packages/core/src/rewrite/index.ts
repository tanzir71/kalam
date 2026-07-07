import type { LlmAdapter, RewriteRequest, RewriteResult } from "../types";
import { chunkText, diffWords } from "../text";
import { promptForGoal } from "./prompts";

const PREAMBLE_RE = /^(here(?:'s| is)(?: the)? rewritten text:|sure[:,]?)\s*/i;

export async function rewrite(adapter: LlmAdapter, request: RewriteRequest): Promise<RewriteResult> {
  const chunks = chunkText(request.text, 600);
  const rewritten: string[] = [];
  let model: string = adapter.id;

  for (const chunk of chunks) {
    const response = await adapter.complete({
      text: chunk.text,
      goal: request.goal,
      prompt: promptForGoal(request.goal, chunk.text),
      variants: 1
    });
    model = response.model;
    rewritten.push(stripModelPreamble(response.text));
  }

  const text = rewritten.join(chunks.length > 1 ? "\n\n" : "");
  return {
    text,
    diff: diffWords(request.text, text),
    meta: {
      model,
      local: adapter.isLocal,
      tier: adapter.id === "rule" ? "noai" : adapter.isLocal ? "local" : "cloud"
    }
  };
}

export function stripModelPreamble(text: string): string {
  return text.replace(PREAMBLE_RE, "").trim();
}

export * from "./prompts";
export * from "./rules";
