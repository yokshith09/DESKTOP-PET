//! IPC command handlers. Each corresponds to an invoke on the frontend.
//! Commands are thin wrappers that deserialize, call core logic, and serialize results.

use loaf_core::settings_service::SettingsService;
use serde_json::Value;
use std::collections::BTreeMap;
use std::sync::Arc;

/// Get all settings with defaults applied.
#[tauri::command]
pub fn settings_get_all(service: tauri::State<'_, Arc<SettingsService>>) -> Result<BTreeMap<String, Value>, String> {
    Ok(service.get_all())
}

/// Set a single setting. Returns error if validation fails.
#[tauri::command]
pub fn setting_set(
    key: String,
    value: Value,
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<(), String> {
    service.set(&key, value).map_err(|e| e.to_string())
}

/// Get a user preference (like window bounds, last view).
#[tauri::command]
pub fn prefs_get(key: String, service: tauri::State<'_, Arc<SettingsService>>) -> Result<Option<Value>, String> {
    Ok(service.get_pref(&key))
}

/// Set a user preference.
#[tauri::command]
pub fn prefs_set(
    key: String,
    value: Value,
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<(), String> {
    service.set_pref(&key, value).map_err(|e| e.to_string())
}
