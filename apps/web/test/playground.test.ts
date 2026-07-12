import { describe, expect, it } from "vitest";
import type { Issue } from "@kalam/core";
import { applySuggestion, buildSegments, readingLabel } from "../src/playground";

const issue: Issue = {
  id: "spelling-0",
  range: { start: 0, end: 3 },
  type: "spelling",
  severity: "high",
  message: "Did you mean the?",
  shortMessage: "Spelling",
  suggestions: ["The"]
};

describe("web playground helpers", () => {
  it("turns issue ranges into lossless text segments", () => {
    const segments = buildSegments("Teh launch", [issue]);
    expect(segments.map((segment) => segment.text).join("")).toBe("Teh launch");
    expect(segments[0].issue?.id).toBe(issue.id);
  });

  it("ignores overlapping lower-priority ranges", () => {
    const overlap = { ...issue, id: "overlap", range: { start: 1, end: 6 } };
    expect(buildSegments("Teh launch", [issue, overlap]).filter((segment) => segment.issue)).toHaveLength(1);
  });

  it("applies the selected suggestion at the exact range", () => {
    expect(applySuggestion("Teh launch", issue, "the")).toBe("The launch");
  });

  it("maps grade levels to honest readability labels", () => {
    expect(readingLabel(5)).toBe("Very clear");
    expect(readingLabel(8)).toBe("Clear");
    expect(readingLabel(11)).toBe("Dense");
    expect(readingLabel(14)).toBe("Very dense");
  });
});
