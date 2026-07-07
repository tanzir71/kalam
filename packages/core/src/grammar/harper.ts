import type { CheckOptions, GrammarEngine, Issue } from "../types";
import { styleIssues } from "./style";

const MISSPELLINGS: Record<string, string> = {
  teh: "the",
  recieve: "receive",
  grammer: "grammar",
  definately: "definitely"
};

export class HarperEngine implements GrammarEngine {
  async check(text: string, opts: CheckOptions = {}): Promise<Issue[]> {
    const dictionary = new Set((opts.customDictionary ?? []).map((word) => word.toLowerCase()));
    const ignored = new Set(opts.ignoredRules ?? []);
    const issues: Issue[] = [];

    for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
      if (dictionary.has(wrong) || ignored.has(`spelling-${wrong}`)) continue;
      const pattern = new RegExp(`\\b${wrong}\\b`, "gi");
      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        issues.push({
          id: `harper-${wrong}-${start}`,
          range: { start, end: start + match[0].length },
          type: "spelling",
          severity: "high",
          message: `Did you mean "${right}"?`,
          shortMessage: "Spelling",
          suggestions: [right],
          rule: `spelling-${wrong}`
        });
      }
    }

    for (const match of text.matchAll(/\b(is|are|was|were)\s+not\s+not\b/gi)) {
      const start = match.index ?? 0;
      issues.push({
        id: `harper-double-negative-${start}`,
        range: { start, end: start + match[0].length },
        type: "grammar",
        severity: "med",
        message: "This double negative may confuse the sentence.",
        shortMessage: "Double negative",
        suggestions: [match[0].replace(/\s+not$/i, "")],
        rule: "grammar-double-negative"
      });
    }

    return [...issues, ...styleIssues(text)].sort((a, b) => a.range.start - b.range.start);
  }
}
