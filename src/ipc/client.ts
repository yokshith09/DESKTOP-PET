// Typed IPC client (F0-07)
// Wraps tauri.invoke() to ensure type safety at call sites

import { invoke } from "@tauri-apps/api/core";
import type { Settings, SettingsKey } from "./settings";

export const ipc = {
  async settingsGetAll(): Promise<Record<SettingsKey, unknown>> {
    return invoke<Record<SettingsKey, unknown>>("settings_get_all");
  },

  async settingSet<K extends SettingsKey>(key: K, value: Settings[K]): Promise<void> {
    return invoke<void>("setting_set", { key, value });
  },

  async prefsGet<T = unknown>(key: string): Promise<T | null> {
    const result = await invoke<T | null>("prefs_get", { key });
    return result;
  },

  async prefsSet<T>(key: string, value: T): Promise<void> {
    return invoke<void>("prefs_set", { key, value });
  },
};
