let shadow: ShadowRoot | undefined;
let activeEditable: HTMLTextAreaElement | HTMLInputElement | HTMLElement | undefined;

document.addEventListener("focusin", (event) => {
  const editable = findEditable(event.target);
  if (editable) {
    activeEditable = editable;
    void checkEditable(editable);
  }
});

document.addEventListener(
  "input",
  (event) => {
    const editable = findEditable(event.target);
    if (editable) void checkEditable(editable);
  },
  true
);

document.addEventListener("mouseup", () => renderSelectionActions());
document.addEventListener("keyup", () => renderSelectionActions());
document.addEventListener("selectionchange", () => renderSelectionActions());

async function checkEditable(editable: HTMLTextAreaElement | HTMLInputElement | HTMLElement): Promise<void> {
  const text = readText(editable);
  const first = findFirstIssue(text);
  if (!first) {
    clearOverlay();
    return;
  }
  const before = text.slice(first.range.start, first.range.end);
  const after = first.suggestions[0];
  renderOverlay(`
    <style>${overlayCss()}</style>
    <div class="kalam-card" data-testid="kalam-suggestion">
      <span class="kalam-badge">No AI - rules</span>
      <strong>${escapeHtml(first.shortMessage)}</strong>
      <p>${escapeHtml(first.message)}</p>
      <button id="kalam-apply">Apply: ${escapeHtml(before)} -> ${escapeHtml(after)}</button>
    </div>
  `);
  shadow?.getElementById("kalam-apply")?.addEventListener("click", () => {
    replaceRange(editable, first.range.start, first.range.end, after);
    clearOverlay();
  });
}

function renderSelectionActions(): void {
  const editable = activeEditable;
  if (!editable) return;
  const selection = getSelectionRange(editable);
  if (!selection || selection.start === selection.end) return;
  renderOverlay(`
    <style>${overlayCss()}</style>
    <div class="kalam-bar" data-testid="kalam-action-bar">
      <span class="kalam-badge">No AI - rules</span>
      <button id="kalam-humanize">Humanize</button>
    </div>
  `);
  shadow?.getElementById("kalam-humanize")?.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    const text = readText(editable).slice(selection.start, selection.end);
    const beforeScore = scoreEstimate(text);
    const rewritten = humanizeSelection(text);
    const afterScore = scoreEstimate(rewritten);
    replaceRange(editable, selection.start, selection.end, rewritten);
    renderOverlay(`
      <style>${overlayCss()}</style>
      <div class="kalam-card" data-testid="kalam-result">
        <span class="kalam-badge">No AI - rules</span>
        <strong>Humanized</strong>
        <p>Estimated ${beforeScore} -> ${afterScore}</p>
      </div>
    `);
  });
}

function findFirstIssue(text: string):
  | {
      range: { start: number; end: number };
      shortMessage: string;
      message: string;
      suggestions: string[];
    }
  | undefined {
  const match = /\b(teh|grammer|recieve)\b/i.exec(text);
  if (!match || match.index === undefined) return undefined;
  const suggestion = match[0].toLowerCase() === "teh" ? "the" : match[0].toLowerCase() === "grammer" ? "grammar" : "receive";
  return {
    range: { start: match.index, end: match.index + match[0].length },
    shortMessage: "Spelling",
    message: `Did you mean "${suggestion}"?`,
    suggestions: [suggestion]
  };
}

function humanizeSelection(text: string): string {
  return text
    .replace(/\bteh\b/gi, "the")
    .replace(/\bMoreover,\s*/gi, "")
    .replace(/\bFurthermore,\s*/gi, "")
    .replace(/\bit is important to note that\s*/gi, "")
    .replace(/\bvery\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function scoreEstimate(text: string): number {
  let score = 20;
  if (/\b(Moreover|Furthermore|Additionally|In conclusion)\b/i.test(text)) score += 30;
  if (/\bit is important to note that\b/i.test(text)) score += 20;
  if (/\bvery\b/i.test(text)) score += 10;
  return Math.max(0, Math.min(100, score));
}

function findEditable(target: EventTarget | null): HTMLTextAreaElement | HTMLInputElement | HTMLElement | undefined {
  if (!(target instanceof HTMLElement)) return undefined;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return target;
  if (target.isContentEditable) return target;
  return undefined;
}

function readText(editable: HTMLTextAreaElement | HTMLInputElement | HTMLElement): string {
  if (editable instanceof HTMLTextAreaElement || editable instanceof HTMLInputElement) return editable.value;
  return editable.textContent ?? "";
}

function replaceRange(
  editable: HTMLTextAreaElement | HTMLInputElement | HTMLElement,
  start: number,
  end: number,
  replacement: string
): void {
  if (editable instanceof HTMLTextAreaElement || editable instanceof HTMLInputElement) {
    editable.value = `${editable.value.slice(0, start)}${replacement}${editable.value.slice(end)}`;
    editable.setSelectionRange(start, start + replacement.length);
    editable.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    const text = editable.textContent ?? "";
    editable.textContent = `${text.slice(0, start)}${replacement}${text.slice(end)}`;
  }
}

function getSelectionRange(
  editable: HTMLTextAreaElement | HTMLInputElement | HTMLElement
): { start: number; end: number } | undefined {
  if (editable instanceof HTMLTextAreaElement || editable instanceof HTMLInputElement) {
    return { start: editable.selectionStart ?? 0, end: editable.selectionEnd ?? 0 };
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;
  const selected = selection.toString();
  const text = editable.textContent ?? "";
  const start = text.indexOf(selected);
  return start >= 0 ? { start, end: start + selected.length } : undefined;
}

function renderOverlay(html: string): void {
  if (!shadow) {
    const host = document.createElement("div");
    host.id = "kalam-extension-root";
    host.style.position = "fixed";
    host.style.right = "20px";
    host.style.bottom = "20px";
    host.style.zIndex = "2147483647";
    shadow = host.attachShadow({ mode: "open" });
    document.documentElement.append(host);
  }
  shadow.innerHTML = html;
}

function clearOverlay(): void {
  if (shadow) shadow.innerHTML = "";
}

function overlayCss(): string {
  return `
    .kalam-card,.kalam-bar{font-family:Inter,Arial,sans-serif;background:#fff;color:#1c1b22;border:1px solid #e4e2dc;border-radius:14px;box-shadow:0 14px 36px rgba(28,27,34,.14);padding:12px;display:grid;gap:8px;max-width:320px}
    .kalam-bar{display:flex;align-items:center}
    button{border:0;border-radius:10px;background:#3b3b98;color:white;min-height:34px;padding:0 12px;font:inherit;cursor:pointer}
    .kalam-badge{border-radius:999px;background:#eee;color:#63616c;font-size:12px;font-weight:700;padding:4px 8px;width:max-content}
    p{margin:0;color:#63616c}
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}
