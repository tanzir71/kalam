import type { Issue } from "@kalam/core";

export interface TextSegment {
  text: string;
  issue?: Issue;
}

export function buildSegments(text: string, issues: Issue[]): TextSegment[] {
  const ordered = issues
    .filter((issue) => issue.range.start >= 0 && issue.range.end <= text.length && issue.range.end > issue.range.start)
    .sort((a, b) => a.range.start - b.range.start || b.range.end - a.range.end);
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const issue of ordered) {
    if (issue.range.start < cursor) continue;
    if (issue.range.start > cursor) segments.push({ text: text.slice(cursor, issue.range.start) });
    segments.push({ text: text.slice(issue.range.start, issue.range.end), issue });
    cursor = issue.range.end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.length ? segments : [{ text }];
}

export function applySuggestion(text: string, issue: Issue, suggestion: string): string {
  const original = text.slice(issue.range.start, issue.range.end);
  const casedSuggestion = /^[A-Z]/.test(original) && /^[a-z]/.test(suggestion)
    ? `${suggestion[0].toUpperCase()}${suggestion.slice(1)}`
    : suggestion;
  return `${text.slice(0, issue.range.start)}${casedSuggestion}${text.slice(issue.range.end)}`;
}

export function readingLabel(grade: number): string {
  if (grade <= 6) return "Very clear";
  if (grade <= 9) return "Clear";
  if (grade <= 12) return "Dense";
  return "Very dense";
}
