//! Loaf desktop shell. Thin by design: windows, tray and OS integration live
//! here; logic lives in `loaf-core` (ADR-002).

mod ipc;
mod tray;

use std::sync::Arc;

use loaf_core::bus::EventBus;
use loaf_core::clock::{Clock, SystemClock};
use loaf_core::db::Database;
use loaf_core::events::Event;
use loaf_core::settings_service::SettingsService;
use tauri::{AppHandle, Manager, RunEvent, WindowEvent};

/// What the shell needs at shutdown.
struct Core {
    db: Arc<Database>,
    bus: EventBus,
    clock: Arc<SystemClock>,
}

/// Quit path (R0-03): announce, let the writer flush, then exit every process.
fn quit(app: &AppHandle) {
    if let Some(core) = app.try_state::<Core>() {
        core.bus.publish(Event::AppShuttingDown {
            at: core.clock.now_ms(),
        });
        tauri::async_runtime::block_on(core.db.shutdown());
    }
    app.exit(0);
}

pub fn run() {
    let app = tauri::Builder::default()
        // A second launch focuses the existing window and exits (R0-01).
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tray::show_main(app);
        }))
        .invoke_handler(tauri::generate_handler![
            ipc::settings_get_all,
            ipc::setting_set,
            ipc::prefs_get,
            ipc::prefs_set,
        ])
        .on_window_event(|window, event| {
            // Closing the main window hides it; the process keeps running (R0-03).
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            let bus = EventBus::default();
            let clock = Arc::new(SystemClock::new());
            let db = Arc::new(Database::open(&data_dir.join("loaf.db"), bus.clone())?);

            app.manage(Arc::new(SettingsService::new(db.clone(), clock.clone())));
            app.manage(Core { db, bus, clock });

            tray::setup_tray(app.handle(), &tray::MenuRegistry::base(), quit)?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build Loaf");

    app.run(|_app, event| {
        // The last window closing must not end the process; only `quit` does (code is Some).
        if let RunEvent::ExitRequested {
            api, code: None, ..
        } = event
        {
            api.prevent_exit();
        }
    });
}
