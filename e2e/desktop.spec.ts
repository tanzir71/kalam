import { expect, test } from "@playwright/test";

test("desktop editor checks grammar and runs humanize", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kalam" })).toBeVisible();

  const editor = page.getByLabel("Kalam editor");
  await editor.fill(
    "Teh writing is very clear. Moreover, it is important to note that Kalam shipped 3 builds in Dhaka. Furthermore, Kalam shipped 3 builds in Dhaka."
  );
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByLabel("Issue list")).toContainText("Did you mean");

  await page.getByRole("button", { name: "Humanize", exact: true }).first().click();
  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByRole("button", { name: "Humanize", exact: true }).last().click();
  await expect(page.getByLabel("Humanize panel")).toContainText("Estimated - real detectors vary.");
  await expect(page.getByLabel("Humanize editor")).toHaveValue(/the writing/i);
  await expect(page.getByLabel("Humanize editor")).not.toHaveValue(/Moreover/);
});

test("desktop model manager handles an absent Ollama server", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Model Manager" }).click();
  await expect(page.getByRole("heading", { name: "Model Manager" })).toBeVisible();
  await expect(page.getByLabel("Model name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pull model" })).toBeVisible();
  await expect(page.getByText(/Ollama is not running|No local models found/)).toBeVisible();
});
