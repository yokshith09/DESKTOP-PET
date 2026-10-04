//! Loaf desktop shell. Thin by design: windows, tray and OS integration live
//! here; logic lives in `loaf-core` (ADR-002).

mod ipc;
mod tray;

use std::sync::Arc;

use loaf_core::bus::{EventBus, Recv};
use loaf_core::clock::{Clock, SystemClock};
use loaf_core::db::Database;
use loaf_core::events::Event;
use loaf_core::notes;
use loaf_core::reminders::{self, ReminderScheduler};
use loaf_core::scheduler::{DbLastSeen, Scheduler};
use loaf_core::settings_service::SettingsService;
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_notification::NotificationExt;

/// What the shell needs at shutdown.
pub(crate) struct Core {
    pub(crate) db: Arc<Database>,
    pub(crate) bus: EventBus,
    pub(crate) clock: Arc<SystemClock>,
}

/// Background tasks that live as long as the app. They park on the bus or a timer between
/// events, so they cost nothing while idle. Dropping the schedulers stops them.
#[allow(dead_code)] // held only so the tasks are not dropped
struct Background {
    day: Scheduler,
    reminders: ReminderScheduler,
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

/// Bus -> every webview (TRD §3). A lagging subscriber tells the UI to refetch.
fn forward_events(app: AppHandle, bus: &EventBus) {
    let mut events = bus.subscribe();
    tauri::async_runtime::spawn(async move {
        loop {
            match events.recv().await {
                Recv::Event(event) => {
                    if let Event::ReminderDue { reminder, .. } = &event {
                        // Best effort: a refused or failed notification must not stop the bus.
                        let _ = app
                            .notification()
                            .builder()
                            .title(&reminder.title)
                            .body("Reminder")
                            .show();
                    }
                    let _ = app.emit("loaf://event", &event);
                }
                Recv::Resync { .. } => {
                    let at = SystemClock::new().now_ms();
                    let _ = app.emit("loaf://event", &Event::ResyncRequired { at });
                }
                Recv::Closed => break,
            }
        }
    });
}

pub fn run() {
    let app = tauri::Builder::default()
        // A second launch focuses the existing window and exits (R0-01).
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tray::show_main(app);
        }))
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            ipc::settings_get_all,
            ipc::setting_set,
            ipc::prefs_get,
            ipc::prefs_set,
            ipc::notes_list,
            ipc::note_get,
            ipc::note_create,
            ipc::note_update,
            ipc::note_set_pinned,
            ipc::note_set_archived,
            ipc::note_delete,
            ipc::note_restore,
            ipc::notes_search,
            ipc::bin_list,
            ipc::note_purge,
            ipc::bin_empty,
            ipc::note_discard_if_empty,
            ipc::reminders_list,
            ipc::reminder_create,
            ipc::reminder_update,
            ipc::reminder_set_done,
            ipc::reminder_delete,
            ipc::labels_list,
            ipc::label_create,
            ipc::label_rename,
            ipc::label_delete,
            ipc::tasks_query,
            ipc::task_quick_add,
            ipc::task_transition,
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
            forward_events(app.handle().clone(), &bus);
            app.manage(Core {
                db: db.clone(),
                bus: bus.clone(),
                clock: clock.clone(),
            });

            // Everything below subscribes to the bus before anything can publish to it.
            let dyn_clock: Arc<dyn Clock> = clock.clone();
            let background = tauri::async_runtime::block_on(async {
                // The Bin is swept at startup and on every day rollover (no timer of its own).
                notes::spawn_bin_janitor(db.clone(), dyn_clock.clone(), &bus);
                let (sweep_db, sweep_clock) = (db.clone(), dyn_clock.clone());
                tauri::async_runtime::spawn(async move {
                    if let Err(error) = notes::purge_expired(&sweep_db, &*sweep_clock).await {
                        tracing::warn!(code = ?error.code, "couldn't clear old notes out of the Bin at startup");
                    }
                });
                // Reminders missed while Loaf was closed fire once, right after start.
                let reminders = reminders::spawn_scheduler(db.clone(), dyn_clock.clone(), &bus);
                let day = Scheduler::spawn(dyn_clock, DbLastSeen(db.clone()), bus.clone());
                Background { day, reminders }
            });
            app.manage(background);

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
