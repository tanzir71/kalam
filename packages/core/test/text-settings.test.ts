import { describe, expect, it } from "vitest";
import {
  applyDiff,
  chunkText,
  defaultSettings,
  deserializeSettings,
  diffWords,
  migrateSettings,
  sentenceSplit,
  serializeSettings,
  tokenizeWords
} from "../src";

describe("settings", () => {
  it("fills defaults and migrates older settings", () => {
    const migrated = migrateSettings({ customDictionary: ["Kalam"] });
    expect(migrated.version).toBe(1);
    expect(migrated.backend).toBe("local");
    expect(migrated.customDictionary).toEqual(["Kalam"]);
    expect(defaultSettings.cloud.enabled).toBe(false);
  });

  it("serializes and deserializes without dropping privacy fields", () => {
    const serialized = serializeSettings({ ...defaultSettings, humanizeAckAt: 123 });
    expect(deserializeSettings(serialized).humanizeAckAt).toBe(123);
  });
});

describe("text utilities", () => {
  it("tokenizes words and splits sentences with offsets", () => {
    expect(tokenizeWords("Kalam writes clearly. Sound human.")).toEqual([
      "Kalam",
      "writes",
      "clearly",
      "Sound",
      "human"
    ]);
    expect(sentenceSplit("One. Two!")).toMatchObject([
      { text: "One.", start: 0, end: 4 },
      { text: "Two!", start: 5, end: 9 }
    ]);
  });

  it("chunks long text under a token budget while preserving order", () => {
    const text = Array.from({ length: 80 }, (_, index) => `Sentence ${index} stays readable.`).join(" ");
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.text).join(" ")).toBe(text);
  });

  it("diff round-trips into the target text", () => {
    const diff = diffWords("Write very clearly.", "Write clearly and naturally.");
    expect(applyDiff(diff)).toBe("Write clearly and naturally.");
    expect(diff.some((op) => op.type === "delete")).toBe(true);
    expect(diff.some((op) => op.type === "insert")).toBe(true);
  });
});
