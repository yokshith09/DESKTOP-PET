//! Loaf desktop shell. Thin by design: windows, tray and OS integration live
//! here; logic lives in `loaf-core` (ADR-002).

mod ipc;

use loaf_core::bus::EventBus;
use loaf_core::clock::SystemClock;
use loaf_core::db::Database;
use loaf_core::settings_service::SettingsService;
use std::path::PathBuf;
use std::sync::Arc;

pub fn run() {
    // TODO: Get app data directory from Tauri context
    let data_dir = PathBuf::from(".");
    let db_path = data_dir.join("loaf.db");

    // Set up core services
    let bus = Arc::new(EventBus::default());
    let clock = Arc::new(SystemClock::new());

    // TODO: Handle database opening errors gracefully
    let db = match Database::open(&db_path, (*bus).clone()) {
        Ok(db) => Arc::new(db),
        Err(e) => {
            eprintln!("Failed to open database: {e}");
            panic!("Cannot start without database");
        }
    };

    let settings_service = Arc::new(SettingsService::new(db, bus, clock));

    tauri::Builder::default()
        .manage(settings_service)
        .invoke_handler(tauri::generate_handler![
            ipc::settings_get_all,
            ipc::setting_set,
            ipc::prefs_get,
            ipc::prefs_set,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Loaf");
}
