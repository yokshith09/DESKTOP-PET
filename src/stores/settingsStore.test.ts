import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

const { settingsStore } = await import("./settingsStore");

describe("settingsStore", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("hydrates from settings_get_all, then patches an incoming change", async () => {
    invoke.mockResolvedValueOnce({ "general.theme": "system" });
    await settingsStore.hydrate();
    expect(invoke).toHaveBeenCalledWith("settings_get_all");
    expect(settingsStore.get("general.theme")).toBe("system");

    const listener = vi.fn();
    settingsStore.subscribe(listener);
    settingsStore.patch("general.theme", "dark");
    expect(settingsStore.get("general.theme")).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
