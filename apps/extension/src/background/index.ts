import { HeuristicDetector, MockAdapter, RuleAdapter, defaultSettings, humanize, rewrite } from "@kalam/core";
import { loadSettings, saveSettings } from "../shared/storage";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ "kalam.installedAt": Date.now() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function handleMessage(message: any): Promise<any> {
  if (message?.type === "settings:get") {
    return { ok: true, settings: await loadSettings() };
  }
  if (message?.type === "settings:set") {
    await saveSettings(message.settings ?? defaultSettings);
    return { ok: true };
  }
  if (message?.type === "rewrite") {
    const result = await rewrite(new RuleAdapter(), {
      text: String(message.text ?? ""),
      goal: message.goal ?? "improve"
    });
    return { ok: true, result };
  }
  if (message?.type === "humanize") {
    const result = await humanize(
      { llm: message.mock ? new MockAdapter() : new RuleAdapter(), detector: new HeuristicDetector() },
      String(message.text ?? ""),
      { acknowledged: true, maxPasses: 3 }
    );
    return { ok: true, result };
  }
  return { ok: false, error: "Unknown message" };
}
