import type { Issue } from "../types";
import { analyzeText, sentenceSplit, tokenizeWords } from "../text";

const HEDGE_WORDS = /\b(maybe|perhaps|very|really|quite|basically|actually)\b/gi;
const PASSIVE_VOICE = /\b(am|is|are|was|were|be|been|being)\s+\w+ed\b/gi;

export function styleIssues(text: string): Issue[] {
  const issues: Issue[] = [];
  collectMatches(text, HEDGE_WORDS, "style-hedge", "style", "Try a more direct word.", issues);
  collectMatches(text, PASSIVE_VOICE, "style-passive", "style", "Consider active voice here.", issues);
  issues.push(...sentenceLengthIssues(text));
  issues.push(...repetitionIssues(text));
  return issues;
}

function collectMatches(
  text: string,
  pattern: RegExp,
  rule: string,
  type: Issue["type"],
  message: string,
  issues: Issue[]
): void {
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    issues.push({
      id: `${rule}-${start}`,
      range: { start, end: start + match[0].length },
      type,
      severity: "low",
      message,
      shortMessage: message,
      suggestions: [],
      rule
    });
  }
}

function sentenceLengthIssues(text: string): Issue[] {
  return sentenceSplit(text)
    .filter((sentence) => tokenizeWords(sentence.text).length > 32)
    .map((sentence) => ({
      id: `readability-long-${sentence.start}`,
      range: { start: sentence.start, end: sentence.end },
      type: "readability" as const,
      severity: "med" as const,
      message: "This sentence is long. Try splitting it for easier reading.",
      shortMessage: "Long sentence",
      suggestions: [],
      rule: "readability-long-sentence"
    }));
}

function repetitionIssues(text: string): Issue[] {
  const words = tokenizeWords(text).map((word) => word.toLowerCase());
  const seen = new Map<string, number>();
  const issues: Issue[] = [];
  for (const word of words) {
    if (word.length < 5) continue;
    seen.set(word, (seen.get(word) ?? 0) + 1);
  }
  for (const [word, count] of seen) {
    if (count >= 4) {
      const index = text.toLowerCase().indexOf(word);
      issues.push({
        id: `style-repeat-${word}`,
        range: { start: index, end: index + word.length },
        type: "style",
        severity: "low",
        message: `"${word}" repeats often. Consider varying the wording.`,
        shortMessage: "Repeated word",
        suggestions: [],
        rule: "style-repetition"
      });
    }
  }
  return issues;
}

export function readabilitySummary(text: string): string {
  const stats = analyzeText(text);
  return `Grade ${stats.fleschKincaidGrade}, ${stats.words} words`;
}
