import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Tauri expects a fixed dev port and must not clear the terminal.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    target: "es2022",
    rollupOptions: {
      // Two entry points (TRD §8): the main window and the pet window (F1-22).
      input: {
        main: resolve(import.meta.dirname, "main.html"),
        pet: resolve(import.meta.dirname, "pet.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", include: ["src/**"], exclude: ["src/**/*.test.{ts,tsx}"] },
  },
});
