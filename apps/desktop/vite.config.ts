import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kalam/core": resolve(__dirname, "../../packages/core/src"),
      "@kalam/ui": resolve(__dirname, "../../packages/ui/src")
    }
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
