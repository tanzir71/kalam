import type { Detector, KalamEngine, RewriteResult } from "../types";
import { diffWords } from "../text";
import { promptForGoal } from "../rewrite";
import { meaningPreserved, hasUnicodeObfuscation } from "./meaning";
import { postProcess } from "./postProcess";

export class HumanizeAcknowledgementRequired extends Error {
  constructor() {
    super(
      "Humanize rewrites your text to read more naturally. Acknowledge the authorship notice before first use."
    );
    this.name = "HumanizeAcknowledgementRequired";
  }
}

export interface HumanizeOptions {
  targetScore?: number;
  maxPasses?: number;
  strength?: number;
  acknowledged?: boolean;
  meaningThreshold?: number;
}

export async function humanize(
  engine: KalamEngine & { detector: Detector },
  text: string,
  opts: HumanizeOptions = {}
): Promise<RewriteResult> {
  if (!opts.acknowledged) throw new HumanizeAcknowledgementRequired();

  const targetScore = opts.targetScore ?? 35;
  const maxPasses = opts.maxPasses ?? 3;
  const strength = opts.strength ?? 0.65;
  const threshold = opts.meaningThreshold ?? 0.72;
  const scoreBefore = await engine.detector.score(text);
  let best = text;
  let bestScore = scoreBefore;
  let passes = 0;

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    if (bestScore <= targetScore) break;
    passes = pass;
    const response = await engine.llm.complete({
      text: best,
      goal: "humanize",
      prompt: promptForGoal("humanize", best),
      variants: 3
    });
    const candidates = unique([postProcess(best, strength), response.text, ...(response.variants ?? [])]);

    for (const candidate of candidates) {
      if (!candidate || hasUnicodeObfuscation(candidate)) continue;
      const meaning = meaningPreserved(best, candidate);
      if (meaning.score < threshold || !meaning.numbersPreserved || !meaning.entitiesPreserved) continue;
      const candidateScore = await engine.detector.score(candidate);
      if (candidateScore <= bestScore) {
        best = candidate;
        bestScore = candidateScore;
      }
    }
  }

  return {
    text: best,
    diff: diffWords(text, best),
    meta: {
      model: engine.llm.id,
      local: engine.llm.isLocal,
      scoreBefore,
      scoreAfter: bestScore,
      passes,
      tier: engine.llm.id === "rule" ? "noai" : engine.llm.isLocal ? "local" : "cloud"
    }
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
