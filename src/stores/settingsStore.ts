// Settings store (F0-07)
// Hydrates from settings_get_all and patches on SettingChanged events

import { ipc, type Settings, type SettingsKey } from "../ipc";

class SettingsStore {
  private settings: Settings | null = null;
  private listeners: Set<() => void> = new Set();

  async hydrate(): Promise<void> {
    try {
      const all = await ipc.settingsGetAll();
      this.settings = all as Settings;
      this.notify();
    } catch (error) {
      console.error("Failed to hydrate settings:", error);
    }
  }

  get<K extends SettingsKey>(key: K): Settings[K] | undefined {
    if (!this.settings) return undefined;
    return this.settings[key];
  }

  async set<K extends SettingsKey>(key: K, value: Settings[K]): Promise<void> {
    try {
      await ipc.settingSet(key, value);
      // Update local cache after successful set
      // (actual update will come from bus event in production)
      if (this.settings) {
        this.settings[key] = value;
        this.notify();
      }
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      throw error;
    }
  }

  patch(key: SettingsKey, value: unknown): void {
    if (!this.settings) return;
    (this.settings as unknown as Record<string, unknown>)[key] = value;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getAll(): Settings | null {
    return this.settings;
  }
}

export const settingsStore = new SettingsStore();
