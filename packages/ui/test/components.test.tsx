import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HumanizePanel, PrivacyBadge, UiGallery } from "../src";

describe("@kalam/ui", () => {
  it("renders privacy badge labels for every tier", () => {
    expect(renderToStaticMarkup(<PrivacyBadge tier="local" />)).toContain("Local");
    expect(renderToStaticMarkup(<PrivacyBadge tier="noai" />)).toContain("No AI - rules");
    expect(renderToStaticMarkup(<PrivacyBadge tier="cloud" provider="OpenAI" />)).toContain("Cloud: OpenAI");
  });

  it("renders the humanize acknowledgement state", () => {
    const html = renderToStaticMarkup(
      <HumanizePanel beforeScore={70} afterScore={44} meaningPreserved passCount={1} tier="noai" acknowledged={false} />
    );
    expect(html).toContain("I understand");
    expect(html).toContain("Estimated - real detectors vary.");
  });

  it("renders the gallery surface", () => {
    const html = renderToStaticMarkup(<UiGallery />);
    expect(html).toContain("Kalam");
    expect(html).toContain("Rewrite");
    expect(html).toContain("Ollama is not running");
  });
});
