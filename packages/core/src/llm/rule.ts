import type { LlmAdapter, LlmRequest, LlmResponse } from "../types";
import { humanizeRules, rewriteWithGoal } from "../rewrite/rules";

export class RuleAdapter implements LlmAdapter {
  id = "rule" as const;
  isLocal = true;

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const goal = req.goal ?? "improve";
    const text = goal === "humanize" ? humanizeRules(req.text, 0.65) : rewriteWithGoal(req.text, goal, 0.65);
    return {
      text,
      variants: [text],
      model: "rules-v1",
      local: true
    };
  }
}
