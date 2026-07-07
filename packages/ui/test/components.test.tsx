import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { colors, darkColors, HumanizePanel, PrivacyBadge, UiGallery } from "../src";

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
    expect(html).toContain("Button states");
    expect(html).toContain("Humanize states");
    expect(html).toContain("Cloud disabled");
    expect(html).toContain("Check meaning");
    expect(html).toContain("Readability underline");
  });

  it("keeps semantic text tokens at WCAG AA contrast", () => {
    const pairs = [
      [colors.text, colors.bg],
      [colors.textMuted, colors.bg],
      [colors.textSubtle, colors.bg],
      [colors.primary, colors.surface],
      [darkColors.text, darkColors.bg],
      [darkColors.textMuted, darkColors.bg],
      [darkColors.textSubtle, darkColors.bg]
    ] as const;

    for (const [foreground, background] of pairs) {
      expect(contrastRatio(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("includes motion, focus, and touch-target accessibility CSS", () => {
    const css = readFileSync(resolve(__dirname, "../src/styles.css"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("@media (pointer: coarse)");
    expect(css).toContain("min-height: 44px");
  });
});

function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}
