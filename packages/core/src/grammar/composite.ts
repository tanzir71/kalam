import type { CheckOptions, GrammarEngine, Issue } from "../types";

const SEVERITY_WEIGHT: Record<Issue["severity"], number> = {
  low: 1,
  med: 2,
  high: 3
};

export class CompositeEngine implements GrammarEngine {
  constructor(private readonly engines: GrammarEngine[]) {}

  async check(text: string, opts: CheckOptions = {}): Promise<Issue[]> {
    const issueGroups = await Promise.all(this.engines.map((engine) => engine.check(text, opts)));
    return dedupeIssues(issueGroups.flat());
  }
}

export function dedupeIssues(issues: Issue[]): Issue[] {
  const sorted = [...issues].sort((a, b) => {
    if (a.range.start !== b.range.start) return a.range.start - b.range.start;
    return SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
  });
  const kept: Issue[] = [];

  for (const issue of sorted) {
    const overlap = kept.find((existing) => rangesOverlap(existing.range, issue.range));
    if (!overlap) {
      kept.push(issue);
      continue;
    }
    if (SEVERITY_WEIGHT[issue.severity] > SEVERITY_WEIGHT[overlap.severity]) {
      kept.splice(kept.indexOf(overlap), 1, issue);
    }
  }

  return kept.sort((a, b) => a.range.start - b.range.start);
}

function rangesOverlap(a: Issue["range"], b: Issue["range"]): boolean {
  return a.start < b.end && b.start < a.end;
}
