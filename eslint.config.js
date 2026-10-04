import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src-tauri", "crates", "target", "node_modules", "spikes", "src/ipc/generated"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    // Node-run tooling (not shipped): allow the Node globals it uses.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
);
