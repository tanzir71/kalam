import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const require = createRequire(import.meta.url);

export function staticGalleryDocument({ appHtml, css }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kalam UI Gallery Static</title>
    <style>${css}</style>
  </head>
  <body>
    ${appHtml}
  </body>
</html>
`;
}

export async function renderStaticGallery(target) {
  const [{ default: React }, { renderToStaticMarkup }] = await Promise.all([
    import("react"),
    import("react-dom/server")
  ]);
  const server = await createServer({
    appType: "custom",
    configFile: resolve("vite.config.ts"),
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const { UiGallery } = await server.ssrLoadModule("../../packages/ui/src/gallery.tsx");
  const cssPath = require.resolve("@kalam/ui/styles.css");
  const css = await readFile(cssPath, "utf8");
  const appHtml = renderToStaticMarkup(React.createElement(UiGallery));
  await server.close();
  const outDir = resolve("dist", target);
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "ui-gallery-static.html"), staticGalleryDocument({ appHtml, css }));
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const target = process.argv[2] === "firefox" ? "firefox" : "chrome";
  await renderStaticGallery(target);
}
