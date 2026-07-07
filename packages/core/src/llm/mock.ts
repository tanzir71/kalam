import type { LlmAdapter, LlmRequest, LlmResponse } from "../types";
import { humanizeRules, rewriteWithGoal } from "../rewrite/rules";

export class MockAdapter implements LlmAdapter {
  id = "mock" as const;
  isLocal = true;

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const goal = req.goal ?? "improve";
    const base = rewriteWithGoal(req.text, goal, 0.7);
    const variants =
      goal === "humanize"
        ? [
            humanizeRules(req.text, 0.4),
            humanizeRules(req.text, 0.8).replace(/\bThis\b/g, "Here"),
            req.text.replace(/\bimportant\b/gi, "useful")
          ].slice(0, req.variants ?? 3)
        : [base];

    return {
      text: variants[0] ?? base,
      variants,
      model: "mock-deterministic",
      local: true
    };
  }
}
