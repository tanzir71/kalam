import type { Issue, RewriteResult } from "@kalam/core";
import { create } from "zustand";
import { addNativeHistory, loadNativeHistory } from "./native";

export type DesktopView = "editor" | "humanize" | "hud" | "batch" | "models" | "history" | "settings";

export interface HistoryItem {
  id: string;
  original: string;
  rewritten: string;
  createdAt: number;
}

interface DesktopState {
  view: DesktopView;
  text: string;
  issues: Issue[];
  lastResult?: RewriteResult;
  history: HistoryItem[];
  setView: (view: DesktopView) => void;
  setText: (text: string) => void;
  setIssues: (issues: Issue[]) => void;
  setLastResult: (result: RewriteResult | undefined) => void;
  addHistory: (item: HistoryItem) => void;
  hydrateHistory: () => void;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  view: "editor",
  text:
    "Moreover, it is important to note that Kalam shipped 3 builds in Dhaka. Furthermore, teh writing is very clear.",
  issues: [],
  history: loadHistory(),
  setView: (view) => set({ view }),
  setText: (text) => set({ text }),
  setIssues: (issues) => set({ issues }),
  setLastResult: (lastResult) => set({ lastResult }),
  addHistory: (item) => {
    set((state) => {
      const history = [item, ...state.history].slice(0, 25);
      localStorage.setItem("kalam.desktop.history", JSON.stringify(history));
      return { history };
    });
    void addNativeHistory(item).then((history) => {
      if (history) set({ history });
    });
  },
  hydrateHistory: () => {
    void loadNativeHistory().then((history) => {
      if (history) set({ history });
    });
  }
}));

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem("kalam.desktop.history") ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}
