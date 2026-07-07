import type { Manifest } from "webextension-polyfill";

export function createManifest(target: "chrome" | "firefox"): Manifest.WebExtensionManifest {
  const background =
    target === "firefox"
      ? ({ scripts: ["background.js"], type: "module" } as Manifest.WebExtensionManifest["background"])
      : ({ service_worker: "background.js", type: "module" } as Manifest.WebExtensionManifest["background"]);

  return {
    manifest_version: 3,
    name: "Kalam",
    version: "0.1.0",
    description: "Write clearly. Sound human.",
    action: {
      default_title: "Kalam",
      default_popup: "popup.html"
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },
    permissions: ["activeTab", "storage", "scripting"],
    host_permissions: ["http://localhost/*", "http://127.0.0.1/*", "<all_urls>"],
    background,
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_idle"
      }
    ],
    web_accessible_resources: [
      {
        resources: ["assets/*", "ui-gallery.html"],
        matches: ["<all_urls>"]
      }
    ],
    browser_specific_settings:
      target === "firefox"
        ? {
            gecko: {
              id: "kalam@example.local",
              strict_min_version: "120.0"
            }
          }
        : undefined
  };
}
