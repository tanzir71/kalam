import react from "@vitejs/plugin-react";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { createManifest } from "./manifest.config";

function manifestPlugin(target: "chrome" | "firefox"): Plugin {
  return {
    name: "kalam-manifest",
    async closeBundle() {
      const outDir = resolve("dist", target);
      await mkdir(outDir, { recursive: true });
      await writeFile(`${outDir}/manifest.json`, JSON.stringify(createManifest(target), null, 2));
    }
  };
}

export default defineConfig(({ mode }) => {
  const target = mode === "firefox" ? "firefox" : "chrome";
  return {
    base: "./",
    plugins: [react(), manifestPlugin(target)],
    resolve: {
      alias: {
        "@kalam/core": resolve(__dirname, "../../packages/core/src"),
        "@kalam/ui": resolve(__dirname, "../../packages/ui/src")
      }
    },
    build: {
      outDir: `dist/${target}`,
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "popup.html"),
          options: resolve(__dirname, "options.html"),
          "ui-gallery": resolve(__dirname, "ui-gallery.html"),
          background: resolve(__dirname, "src/background/index.ts"),
          content: resolve(__dirname, "src/content/index.ts")
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      }
    }
  };
});
