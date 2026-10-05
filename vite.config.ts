import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Tauri expects a fixed dev port and must not clear the terminal.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    target: "es2022",
    rollupOptions: {
      // Two entry points (TRD §8): the main window and the pet window (F1-22).
      // `--mode preview` builds one self-contained bundle for design previews.
      input: {
        main: resolve(import.meta.dirname, "main.html"),
        ...(mode === "preview" ? {} : { pet: resolve(import.meta.dirname, "pet.html") }),
      } as Record<string, string>,
      ...(mode === "preview" ? { output: { inlineDynamicImports: true } } : {}),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", include: ["src/**"], exclude: ["src/**/*.test.{ts,tsx}"] },
  },
}));
