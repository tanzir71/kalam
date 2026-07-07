import { describe, expect, it } from "vitest";
import {
  CompositeEngine,
  HarperEngine,
  HeuristicDetector,
  LanguageToolEngine,
  MockAdapter,
  RuleAdapter,
  hasUnicodeObfuscation,
  humanize,
  meaningPreserved,
  postProcess
} from "../src";
import type { GrammarEngine } from "../src";

describe("grammar engines", () => {
  it("HarperEngine flags seeded errors and offers fixes", async () => {
    const issues = await new HarperEngine().check("Teh grammer is not not ready.");
    expect(issues.some((issue) => issue.type === "spelling" && issue.suggestions.includes("the"))).toBe(true);
    expect(issues.some((issue) => issue.rule === "grammar-double-negative")).toBe(true);
  });

  it("LanguageToolEngine degrades to an empty list when absent", async () => {
    const engine = new LanguageToolEngine("http://localhost:1", async () => {
      throw new Error("connection refused");
    });
    await expect(engine.check("Bad text")).resolves.toEqual([]);
  });

  it("CompositeEngine dedupes overlapping ranges and keeps severity", async () => {
    const low: GrammarEngine = {
      check: async () => [
        {
          id: "a",
          range: { start: 0, end: 3 },
          type: "style",
          severity: "low",
          message: "a",
          shortMessage: "a",
          suggestions: []
        }
      ]
    };
    const high: GrammarEngine = {
      check: async () => [
        { id: "b", range: { start: 1, end: 4 }, type: "spelling", severity: "high", message: "b", shortMessage: "b", suggestions: ["the"] }
      ]
    };
    const issues = await new CompositeEngine([low, high]).check("teh");
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("b");
  });
});

describe("detector and humanize", () => {
  const machine =
    "Moreover, it is important to note that this solution provides a comprehensive framework. Furthermore, this solution provides a comprehensive approach. Additionally, this solution provides a comprehensive outcome.";
  const human =
    "I rewrote the first paragraph after lunch. The short version worked better, so I kept the numbers and cut the stiff transition at the top.";

  it("ranks machine-like samples higher than human-like samples", () => {
    const detector = new HeuristicDetector();
    expect(detector.score(machine)).toBeGreaterThan(detector.score(human));
  });

  it("postProcess removes formulaic markers without unicode obfuscation", () => {
    const result = postProcess(machine);
    expect(result).not.toMatch(/Moreover|Furthermore|Additionally/);
    expect(hasUnicodeObfuscation(result)).toBe(false);
  });

  it("meaning guard preserves numbers and named entities", () => {
    const score = meaningPreserved("Kalam shipped 3 builds in Dhaka.", "Kalam shipped 3 builds in Dhaka today.");
    expect(score.score).toBeGreaterThan(0.72);
    expect(score.numbersPreserved).toBe(true);
    expect(score.entitiesPreserved).toBe(true);
  });

  it("meaning guard does not require formulaic transitions to be retained", () => {
    const score = meaningPreserved(
      "Moreover, Kalam shipped 3 builds in Dhaka. Furthermore, Kalam shipped 3 builds in Dhaka.",
      "Kalam shipped 3 builds in Dhaka. Kalam shipped 3 builds in Dhaka."
    );
    expect(score.entitiesPreserved).toBe(true);
    expect(score.score).toBeGreaterThan(0.72);
  });

  it("runs Humanize end-to-end with MockAdapter and lowers score", async () => {
    const detector = new HeuristicDetector();
    const result = await humanize(
      { llm: new MockAdapter(), detector },
      "Moreover, it is important to note that Kalam shipped 3 builds in Dhaka. Furthermore, Kalam shipped 3 builds in Dhaka.",
      { acknowledged: true, maxPasses: 3, targetScore: 20 }
    );
    expect(result.meta.scoreAfter).toBeLessThanOrEqual(result.meta.scoreBefore ?? 100);
    expect(result.text).toContain("3");
    expect(result.text).toContain("Dhaka");
    expect(hasUnicodeObfuscation(result.text)).toBe(false);
  });

  it("runs Humanize with RuleAdapter as the no-AI path", async () => {
    const detector = new HeuristicDetector();
    const input =
      "Moreover, it is important to note that Kalam shipped 3 builds in Dhaka. Furthermore, Kalam shipped 3 builds in Dhaka.";
    const result = await humanize({ llm: new RuleAdapter(), detector }, input, {
      acknowledged: true,
      maxPasses: 2,
      targetScore: 20
    });
    expect(result.meta.tier).toBe("noai");
    expect(result.meta.scoreAfter).toBeLessThanOrEqual(result.meta.scoreBefore ?? 100);
  });

  it("requires the first-run acknowledgement", async () => {
    await expect(
      humanize({ llm: new RuleAdapter(), detector: new HeuristicDetector() }, "Text to humanize")
    ).rejects.toThrow(/acknowledge/i);
  });
});
