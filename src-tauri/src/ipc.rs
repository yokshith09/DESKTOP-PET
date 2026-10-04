//! IPC command handlers. Each corresponds to an invoke on the frontend.
//! Commands are thin wrappers that deserialize, call core logic, and serialize results.

use loaf_core::settings_service::SettingsService;
use serde_json::Value;
use std::collections::BTreeMap;
use std::sync::Arc;

/// Get all settings with defaults applied.
#[tauri::command]
pub async fn settings_get_all(
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<BTreeMap<String, Value>, String> {
    service.get_all().await.map_err(|e| e.to_string())
}

/// Set a single setting. Returns error if validation fails.
#[tauri::command]
pub async fn setting_set(
    key: String,
    value: Value,
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<(), String> {
    service.set(&key, value).await.map_err(|e| e.to_string())
}

/// Get a user preference (like window bounds, last view).
#[tauri::command]
pub async fn prefs_get(
    key: String,
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<Option<Value>, String> {
    service.get_pref(&key).await.map_err(|e| e.to_string())
}

/// Set a user preference.
#[tauri::command]
pub async fn prefs_set(
    key: String,
    value: Value,
    service: tauri::State<'_, Arc<SettingsService>>,
) -> Result<(), String> {
    service
        .set_pref(&key, value)
        .await
        .map_err(|e| e.to_string())
}
