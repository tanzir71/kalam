import type { RewriteGoal } from "../types";

export const rewritePrompts: Record<RewriteGoal, string> = {
  improve: "Improve clarity while preserving meaning. Return only the rewritten text.",
  shorten: "Make the text more concise without removing facts. Return only the rewritten text.",
  expand: "Expand slightly with useful context while preserving facts. Return only the rewritten text.",
  formal: "Rewrite in a formal register while preserving meaning. Return only the rewritten text.",
  casual: "Rewrite in a natural casual register while preserving meaning. Return only the rewritten text.",
  confident: "Rewrite with a confident tone while preserving meaning. Return only the rewritten text.",
  simplify: "Simplify wording and sentence structure while preserving meaning. Return only the rewritten text.",
  humanize:
    "Rewrite so it reads naturally, with varied sentence rhythm and no formulaic filler. Preserve facts, numbers, citations, and markdown. Return only the rewritten text."
};

export function promptForGoal(goal: RewriteGoal, text: string): string {
  return `${rewritePrompts[goal]}\n\nText:\n${text}`;
}
