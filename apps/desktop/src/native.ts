import { invoke } from "@tauri-apps/api/core";
import type { HistoryItem } from "./store";

interface NativeSettingsPayload {
  backend: string;
  cloud_enabled: boolean;
  provider: string;
  api_key?: string | null;
}

interface NativeHistoryRow {
  id: string;
  original: string;
  rewritten: string;
  created_at: number;
}

export interface DesktopSettings {
  backend: "noai" | "local" | "cloud";
  cloudEnabled: boolean;
  provider: string;
  apiKey: string;
}

export interface NativeModel {
  name: string;
  size?: number;
}

const SETTINGS_KEY = "kalam.desktop.settings";

export async function loadDesktopSettings(): Promise<DesktopSettings> {
  const native = await invokeIfAvailable<NativeSettingsPayload>("settings_get");
  if (native) return fromNativeSettings(native);

  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "") as DesktopSettings;
  } catch {
    return defaultDesktopSettings();
  }
}

export async function saveDesktopSettings(settings: DesktopSettings): Promise<DesktopSettings> {
  const payload: NativeSettingsPayload = {
    backend: settings.backend,
    cloud_enabled: settings.cloudEnabled,
    provider: settings.provider,
    api_key: settings.apiKey
  };
  const native = await invokeIfAvailable<NativeSettingsPayload>("settings_set", { payload });
  const saved = native ? fromNativeSettings(native) : settings;
  if (!native) localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
  return saved;
}

export async function loadNativeHistory(): Promise<HistoryItem[] | undefined> {
  const rows = await invokeIfAvailable<NativeHistoryRow[]>("history_query");
  return rows?.map(fromNativeHistoryRow);
}

export async function addNativeHistory(item: HistoryItem): Promise<HistoryItem[] | undefined> {
  const rows = await invokeIfAvailable<NativeHistoryRow[]>("history_add", {
    row: toNativeHistoryRow(item)
  });
  return rows?.map(fromNativeHistoryRow);
}

export async function listNativeModels(): Promise<NativeModel[] | undefined> {
  return invokeIfAvailable<NativeModel[]>("list_ollama_models");
}

async function invokeIfAvailable<T>(command: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (!isTauriRuntime()) return undefined;
  try {
    return await invoke<T>(command, args);
  } catch {
    return undefined;
  }
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function fromNativeSettings(payload: NativeSettingsPayload): DesktopSettings {
  return {
    backend: payload.backend === "local" || payload.backend === "cloud" ? payload.backend : "noai",
    cloudEnabled: payload.cloud_enabled,
    provider: payload.provider || "openai",
    apiKey: payload.api_key ?? ""
  };
}

function defaultDesktopSettings(): DesktopSettings {
  return {
    backend: "noai",
    cloudEnabled: false,
    provider: "openai",
    apiKey: ""
  };
}

function toNativeHistoryRow(item: HistoryItem): NativeHistoryRow {
  return {
    id: item.id,
    original: item.original,
    rewritten: item.rewritten,
    created_at: item.createdAt
  };
}

function fromNativeHistoryRow(row: NativeHistoryRow): HistoryItem {
  return {
    id: row.id,
    original: row.original,
    rewritten: row.rewritten,
    createdAt: row.created_at
  };
}
