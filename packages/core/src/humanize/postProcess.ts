import { humanizeRules } from "../rewrite/rules";

export function postProcess(text: string, strength = 0.65): string {
  return humanizeRules(text, strength);
}
