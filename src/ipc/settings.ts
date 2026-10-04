// Generated types for settings (F0-07)
// TODO: auto-generate from Rust types with ts-rs

export type ThemeOption = "light" | "dark" | "system";
export type FontSize = "S" | "M" | "L";
export type PetSize = "S" | "M" | "L";

export interface Settings {
  "general.autostart": boolean;
  "general.theme": ThemeOption;
  "general.font_size": FontSize;
  "pet.visible": boolean;
  "pet.size": PetSize;
  "pet.opacity": number;
  "pet.always_on_top": boolean;
  "shortcuts.global_open": string | null;
  "shortcuts.global_new_note": string | null;
  "shortcuts.global_new_task": string | null;
  "tracking.apps": boolean;
  "tracking.exclude_apps": string[];
  "advanced.log_level": "trace" | "debug" | "info" | "warn" | "error";
}

export type SettingsKey = keyof Settings;
