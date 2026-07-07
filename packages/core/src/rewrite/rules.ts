import type { RewriteGoal } from "../types";

const HEDGES = [
  /\bvery\b/gi,
  /\breally\b/gi,
  /\bquite\b/gi,
  /\bperhaps\b/gi,
  /\bit is important to note that\s*/gi,
  /\bin order to\b/gi
];

const FORMULAIC_TRANSITIONS = [
  /\bMoreover,\s*/gi,
  /\bFurthermore,\s*/gi,
  /\bIn conclusion,\s*/gi,
  /\bAdditionally,\s*/gi,
  /\bIt is worth noting that\s*/gi
];

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bdo not\b/gi, "don't"],
  [/\bcannot\b/gi, "can't"],
  [/\bwill not\b/gi, "won't"],
  [/\bit is\b/gi, "it's"],
  [/\bthat is\b/gi, "that's"],
  [/\bthere is\b/gi, "there's"]
];

export function rewriteWithGoal(text: string, goal: RewriteGoal, strength = 0.5): string {
  const cleaned = cleanCommon(text);
  switch (goal) {
    case "shorten":
      return preserveTerminalPunctuation(removeRedundancy(cleaned));
    case "expand":
      return expandSlightly(cleaned);
    case "formal":
      return formalize(cleaned);
    case "casual":
      return casualize(cleaned);
    case "confident":
      return confident(cleaned);
    case "simplify":
      return simplify(cleaned);
    case "humanize":
      return humanizeRules(cleaned, strength);
    case "improve":
    default:
      return improve(cleaned);
  }
}

export function cleanCommon(text: string): string {
  let next = text.replace(/\bteh\b/gi, "the").replace(/\bgrammer\b/gi, "grammar");
  next = next.replace(/\s+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ");
  return next.trim();
}

export function removeRedundancy(text: string): string {
  let next = text;
  for (const hedge of HEDGES) {
    next = next.replace(hedge, (match) => (match.toLowerCase().includes("in order") ? "to" : ""));
  }
  next = next.replace(/\bthe fact that\b/gi, "that").replace(/\bdue to the fact that\b/gi, "because");
  return cleanCommon(next);
}

export function stripFormulaicTransitions(text: string): string {
  let next = text;
  for (const transition of FORMULAIC_TRANSITIONS) {
    next = next.replace(transition, "");
  }
  return cleanCommon(next);
}

export function applyContractions(text: string): string {
  return CONTRACTIONS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

export function humanizeRules(text: string, strength = 0.5): string {
  const allowCasual = strength >= 0.35;
  let next = stripFormulaicTransitions(removeRedundancy(text));
  if (allowCasual) next = applyContractions(next);
  next = varySentenceOpeners(next);
  return preserveTerminalPunctuation(next);
}

function improve(text: string): string {
  return preserveTerminalPunctuation(removeRedundancy(text).replace(/\butilize\b/gi, "use"));
}

function expandSlightly(text: string): string {
  const trimmed = cleanCommon(text);
  if (trimmed.length === 0) return trimmed;
  if (/for example|because|which means/i.test(trimmed)) return trimmed;
  return `${trimmed.replace(/[.!?]$/u, "")}, with the main point made more explicit.`;
}

function formalize(text: string): string {
  return removeRedundancy(text)
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bwon't\b/gi, "will not")
    .replace(/\bkind of\b/gi, "somewhat");
}

function casualize(text: string): string {
  return applyContractions(removeRedundancy(text)).replace(/\btherefore\b/gi, "so");
}

function confident(text: string): string {
  return removeRedundancy(text)
    .replace(/\bI think that\s*/gi, "")
    .replace(/\bmaybe\s*/gi, "")
    .replace(/\bmight\b/gi, "will");
}

function simplify(text: string): string {
  return removeRedundancy(text)
    .replace(/\bapproximately\b/gi, "about")
    .replace(/\bfacilitate\b/gi, "help")
    .replace(/\bprioritize\b/gi, "focus on")
    .replace(/\bsubsequently\b/gi, "then");
}

function varySentenceOpeners(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences
    .map((sentence, index) => {
      const trimmed = sentence.trim();
      if (index % 3 === 1 && /^This\b/.test(trimmed)) return trimmed.replace(/^This\b/, "That");
      if (index % 3 === 2 && /^The\b/.test(trimmed)) return trimmed.replace(/^The\b/, "In practice, the");
      return trimmed;
    })
    .join(" ");
}

function preserveTerminalPunctuation(text: string): string {
  const trimmed = cleanCommon(text);
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
