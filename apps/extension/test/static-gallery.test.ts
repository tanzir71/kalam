import { describe, expect, it } from "vitest";
// @ts-expect-error The build helper is a Node ESM script exercised directly by Vitest.
import { staticGalleryDocument } from "../scripts/render-static-gallery.mjs";

describe("static UI gallery", () => {
  it("generates a no-module single-file document", () => {
    const html = staticGalleryDocument({
      appHtml: "<main>Button states</main>",
      css: ".k-root{color:#1c1b22}"
    });

    expect(html).toContain("<style>.k-root{color:#1c1b22}</style>");
    expect(html).toContain("<main>Button states</main>");
    expect(html).not.toContain("type=\"module\"");
    expect(html).not.toContain("<script");
  });
});
