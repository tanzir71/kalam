import { describe, expect, it } from "vitest";
import { createManifest } from "../manifest.config";

describe("extension manifest", () => {
  it("uses a service worker for Chromium", () => {
    const manifest = createManifest("chrome");
    expect(manifest.background).toMatchObject({ service_worker: "background.js" });
  });

  it("uses background scripts and gecko settings for Firefox", () => {
    const manifest = createManifest("firefox");
    expect(manifest.background).toMatchObject({ scripts: ["background.js"] });
    expect(manifest.browser_specific_settings?.gecko?.id).toBe("kalam@example.local");
  });
});
