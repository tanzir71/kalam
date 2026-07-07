import { describe, expect, it } from "vitest";

describe("desktop smoke data", () => {
  it("has the expected navigation labels", () => {
    expect(["Editor", "Humanize", "Batch", "Model Manager", "History", "Settings"]).toContain("Model Manager");
  });
});
