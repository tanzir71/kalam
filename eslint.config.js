import js from "@eslint/js";
import tseslint from "typescript-eslint";

const browserGlobals = {
  AsyncIterable: "readonly",
  Blob: "readonly",
  BroadcastChannel: "readonly",
  CSSStyleSheet: "readonly",
  CustomEvent: "readonly",
  Document: "readonly",
  Element: "readonly",
  Event: "readonly",
  EventTarget: "readonly",
  FormData: "readonly",
  HTMLButtonElement: "readonly",
  HTMLInputElement: "readonly",
  HTMLElement: "readonly",
  HTMLTextAreaElement: "readonly",
  KeyboardEvent: "readonly",
  MouseEvent: "readonly",
  Node: "readonly",
  Request: "readonly",
  Response: "readonly",
  ShadowRoot: "readonly",
  URL: "readonly",
  WebSocket: "readonly",
  Window: "readonly",
  chrome: "readonly",
  console: "readonly",
  document: "readonly",
  fetch: "readonly",
  globalThis: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  process: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  window: "readonly"
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "apps/desktop/src-tauri/target/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: browserGlobals
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["**/*.config.{js,ts}", "scripts/**/*.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];
