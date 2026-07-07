import type { DiffOp } from "../types";

const TOKEN_RE = /\s+|\S+/g;

export function diffWords(before: string, after: string): DiffOp[] {
  const a = tokenizeForDiff(before);
  const b = tokenizeForDiff(after);
  const table = buildLcsTable(a, b);
  const ops: DiffOp[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      ops.push({ type: "equal", text: a[i - 1] });
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      ops.push({ type: "delete", text: a[i - 1] });
      i -= 1;
    } else {
      ops.push({ type: "insert", text: b[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    ops.push({ type: "delete", text: a[i - 1] });
    i -= 1;
  }
  while (j > 0) {
    ops.push({ type: "insert", text: b[j - 1] });
    j -= 1;
  }

  return mergeOps(ops.reverse());
}

export function applyDiff(ops: DiffOp[]): string {
  return ops
    .filter((op) => op.type !== "delete")
    .map((op) => op.text)
    .join("");
}

export function hasMeaningfulDiff(ops: DiffOp[]): boolean {
  return ops.some((op) => op.type !== "equal" && op.text.trim().length > 0);
}

function tokenizeForDiff(text: string): string[] {
  return text.match(TOKEN_RE) ?? [];
}

function buildLcsTable(a: string[], b: string[]): number[][] {
  const table = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      table[i][j] =
        a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table;
}

function mergeOps(ops: DiffOp[]): DiffOp[] {
  const merged: DiffOp[] = [];
  for (const op of ops) {
    const previous = merged.at(-1);
    if (previous?.type === op.type) {
      previous.text += op.text;
    } else {
      merged.push({ ...op });
    }
  }
  return merged;
}
