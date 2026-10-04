//! Loaf desktop shell. Thin by design: windows, tray and OS integration live
//! here; logic lives in `loaf-core` (ADR-002).

mod ipc;
mod single_instance;
mod tray;

use loaf_core::bus::EventBus;
use loaf_core::clock::SystemClock;
use loaf_core::db::Database;
use loaf_core::settings_service::SettingsService;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;

pub fn run() {
    // TODO: Get app data directory from Tauri context
    let data_dir = PathBuf::from(".");
    let db_path = data_dir.join("loaf.db");

    // Single-instance check (F0-08)
    if !single_instance::acquire_lock(&data_dir).unwrap_or(false) {
        eprintln!("Another instance of Loaf is already running");
        return;
    }

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
    let data_dir_clone = data_dir.clone();

    let app = tauri::Builder::default()
        .manage(settings_service)
        .invoke_handler(tauri::generate_handler![
            ipc::settings_get_all,
            ipc::setting_set,
            ipc::prefs_get,
            ipc::prefs_set,
        ])
        .setup(move |app| {
            // Set up tray icon and menu (F0-08)
            tray::setup_tray(app)?;

            // TODO: Set up window close behavior to hide instead of close
            // TODO: Register tray click handlers

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build app");

    app.run(|_app_handle, event| {
        match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                // TODO: Publish AppShuttingDown event, flush DB
                api.prevent_exit();
            }
            _ => {}
        }
    });

    // Clean up lock file on exit
    let _ = single_instance::release_lock(&data_dir_clone);
}
