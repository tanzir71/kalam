import { defaultSettings, migrateSettings, type Settings } from "@kalam/core";

const SETTINGS_KEY = "kalam.settings";
const SITE_KEY = "kalam.siteEnabled";

export async function loadSettings(): Promise<Settings> {
  const stored = await getValue<unknown>(SETTINGS_KEY);
  return migrateSettings(stored ?? defaultSettings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setValue(SETTINGS_KEY, settings);
}

export async function loadSiteEnabled(): Promise<boolean> {
  const stored = await getValue<boolean>(SITE_KEY);
  return stored ?? true;
}

export async function saveSiteEnabled(enabled: boolean): Promise<void> {
  await setValue(SITE_KEY, enabled);
}

async function getValue<T>(key: string): Promise<T | undefined> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  }
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

async function setValue<T>(key: string, value: T): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}
