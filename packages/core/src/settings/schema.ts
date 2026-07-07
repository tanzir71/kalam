import { z } from "zod";

export const SettingsSchema = z.object({
  version: z.number().int().nonnegative().default(1),
  backend: z.enum(["local", "cloud", "noai"]).default("local"),
  cloud: z
    .object({
      enabled: z.boolean().default(false),
      provider: z.enum(["openai", "anthropic"]).default("openai"),
      apiKey: z.string().default("")
    })
    .default({ enabled: false, provider: "openai", apiKey: "" }),
  local: z
    .object({
      ollamaUrl: z.string().url().default("http://localhost:11434"),
      lmStudioUrl: z.string().url().default("http://localhost:1234")
    })
    .default({
      ollamaUrl: "http://localhost:11434",
      lmStudioUrl: "http://localhost:1234"
    }),
  models: z
    .object({
      rewrite: z.string().default("llama3.1:8b"),
      humanize: z.string().default("llama3.1:8b")
    })
    .default({ rewrite: "llama3.1:8b", humanize: "llama3.1:8b" }),
  humanize: z
    .object({
      targetScore: z.number().min(0).max(100).default(35),
      maxPasses: z.number().int().min(1).max(8).default(3),
      preserveMeaningStrict: z.boolean().default(true)
    })
    .default({ targetScore: 35, maxPasses: 3, preserveMeaningStrict: true }),
  privacy: z.object({ showBadge: z.boolean().default(true) }).default({ showBadge: true }),
  locale: z.string().default("en"),
  customDictionary: z.array(z.string()).default([]),
  ignoredRules: z.array(z.string()).default([]),
  humanizeAckAt: z.number().optional()
});

export type Settings = z.infer<typeof SettingsSchema>;

export const defaultSettings: Settings = SettingsSchema.parse({});

export function migrateSettings(input: unknown): Settings {
  const candidate = typeof input === "object" && input !== null ? input : {};
  const versioned = candidate as Partial<Settings> & { version?: number };

  if (versioned.version === undefined || versioned.version < 1) {
    return SettingsSchema.parse({
      ...versioned,
      version: 1,
      backend: versioned.backend ?? "local"
    });
  }

  return SettingsSchema.parse(versioned);
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(SettingsSchema.parse(settings));
}

export function deserializeSettings(serialized: string): Settings {
  return migrateSettings(JSON.parse(serialized));
}
