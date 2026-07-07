import { expect, test, chromium, type BrowserContext } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

let server: Server;
let serverUrl = "";
let context: BrowserContext;
let extensionId = "";

test.beforeAll(async () => {
  const extensionPath = resolve("apps/extension/dist/chrome");
  if (!existsSync(resolve(extensionPath, "manifest.json"))) {
    mkdirSync(extensionPath, { recursive: true });
  }

  server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!doctype html>
      <html>
        <body>
          <textarea id="editor" style="width:600px;height:240px"></textarea>
        </body>
      </html>
    `);
  });
  await new Promise<void>((resolveReady) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "object" && address) serverUrl = `http://127.0.0.1:${address.port}`;
      resolveReady();
    });
  });

  context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  extensionId = worker.url().split("/")[2];
});

test.afterAll(async () => {
  await context?.close();
  await new Promise<void>((resolveDone) => server.close(() => resolveDone()));
});

test("underlines a textarea issue and applies the suggestion", async () => {
  const page = await context.newPage();
  await page.goto(serverUrl);
  const editor = page.locator("#editor");
  await editor.fill("Teh writing is clear.");
  await editor.focus();
  await expect(page.getByTestId("kalam-suggestion")).toBeVisible();
  await page.getByRole("button", { name: /Apply/i }).click();
  await expect(editor).toHaveValue("the writing is clear.");
});

test("humanizes selected text and settings persist", async () => {
  const page = await context.newPage();
  await page.goto(serverUrl);
  const editor = page.locator("#editor");
  await editor.fill("Moreover, it is important to note that Kalam shipped 3 builds in Dhaka.");
  await editor.selectText();
  await expect(page.getByTestId("kalam-action-bar")).toBeVisible();
  await page.getByRole("button", { name: "Humanize" }).click();
  await expect(page.getByTestId("kalam-result")).toBeVisible();
  await expect(editor).toHaveValue(/Kalam shipped 3 builds in Dhaka/);

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByLabel("API key").fill("sk-local-test");
  await options.reload();
  await expect(options.getByLabel("API key")).toHaveValue("sk-local-test");
});
