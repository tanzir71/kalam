import type { CheckOptions, GrammarEngine, Issue } from "../types";

type FetchLike = typeof fetch;

export class LanguageToolEngine implements GrammarEngine {
  constructor(
    private readonly endpoint = "http://localhost:8081/v2/check",
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async check(text: string, opts: CheckOptions = {}): Promise<Issue[]> {
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text, language: opts.locale ?? "en-US" })
      });
      if (!response.ok) return [];
      const data = (await response.json()) as {
        matches?: Array<{
          offset: number;
          length: number;
          message: string;
          shortMessage?: string;
          rule?: { id?: string; issueType?: string };
          replacements?: Array<{ value: string }>;
        }>;
      };
      return (data.matches ?? []).map((match) => ({
        id: `lt-${match.rule?.id ?? "rule"}-${match.offset}`,
        range: { start: match.offset, end: match.offset + match.length },
        type: mapIssueType(match.rule?.issueType),
        severity: "med",
        message: match.message,
        shortMessage: match.shortMessage || match.message,
        suggestions: (match.replacements ?? []).map((replacement) => replacement.value).slice(0, 5),
        rule: match.rule?.id
      }));
    } catch {
      return [];
    }
  }
}

function mapIssueType(issueType?: string): Issue["type"] {
  if (issueType?.includes("misspelling")) return "spelling";
  if (issueType?.includes("style")) return "style";
  if (issueType?.includes("typographical")) return "punctuation";
  return "grammar";
}
