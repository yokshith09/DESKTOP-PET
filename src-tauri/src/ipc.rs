//! IPC command handlers. Thin: deserialize, call `loaf-core`, return. Errors cross the boundary
//! as `AppError` (`{ code, message, field? }`).

use std::collections::BTreeMap;
use std::sync::Arc;

use loaf_core::daily_log::{self, DailyLog};
use loaf_core::error::{AppError, Result};
use loaf_core::labels::{self, Label, LabelCount};
use loaf_core::notes::{self, BinNote, Note, NoteInput, NotePatch, NoteSort, NoteSummary};
use loaf_core::reminders::{self, Reminder, ReminderInput, ReminderPatch};
use loaf_core::settings_service::SettingsService;
use loaf_core::tasks::{self, Task, TaskFilters, TaskRow, TaskStatus, TaskView};
use serde_json::Value;
use tauri::State;

use crate::Core;

// ---- settings and preferences ---------------------------------------------------------------

#[tauri::command]
pub async fn settings_get_all(
    service: State<'_, Arc<SettingsService>>,
) -> Result<BTreeMap<String, Value>> {
    service.get_all().await
}

#[tauri::command]
pub async fn setting_set(
    key: String,
    value: Value,
    service: State<'_, Arc<SettingsService>>,
) -> Result<()> {
    service.set(&key, value).await
}

#[tauri::command]
pub async fn prefs_get(
    key: String,
    service: State<'_, Arc<SettingsService>>,
) -> Result<Option<Value>> {
    service.get_pref(&key).await
}

#[tauri::command]
pub async fn prefs_set(
    key: String,
    value: Value,
    service: State<'_, Arc<SettingsService>>,
) -> Result<()> {
    service.set_pref(&key, value).await
}

// ---- notes ----------------------------------------------------------------------------------

#[tauri::command]
pub async fn notes_list(
    archived: bool,
    label_id: Option<String>,
    sort: Option<NoteSort>,
    core: State<'_, Core>,
) -> Result<Vec<NoteSummary>> {
    notes::list(
        &core.db,
        archived,
        label_id.as_deref(),
        sort.unwrap_or_default(),
    )
    .await
}

#[tauri::command]
pub async fn note_get(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::get(&core.db, &id).await
}

#[tauri::command]
pub async fn note_create(input: NoteInput, core: State<'_, Core>) -> Result<Note> {
    notes::create(&core.db, &*core.clock, input).await
}

#[tauri::command]
pub async fn note_update(id: String, patch: NotePatch, core: State<'_, Core>) -> Result<Note> {
    notes::update(&core.db, &*core.clock, &id, patch).await
}

#[tauri::command]
pub async fn note_set_pinned(id: String, pinned: bool, core: State<'_, Core>) -> Result<Note> {
    notes::set_pinned(&core.db, &*core.clock, &id, pinned).await
}

#[tauri::command]
pub async fn note_set_archived(id: String, archived: bool, core: State<'_, Core>) -> Result<Note> {
    notes::set_archived(&core.db, &*core.clock, &id, archived).await
}

/// Moves the note to the Bin and returns it, so the UI can offer Undo via `note_restore`.
#[tauri::command]
pub async fn note_delete(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::delete(&core.db, &*core.clock, &id).await
}

/// Takes a note out of the Bin.
#[tauri::command]
pub async fn note_restore(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::restore_from_bin(&core.db, &*core.clock, &id).await
}

#[tauri::command]
pub async fn notes_search(
    query: String,
    archived: bool,
    core: State<'_, Core>,
) -> Result<Vec<NoteSummary>> {
    notes::search(&core.db, &query, archived).await
}

#[tauri::command]
pub async fn bin_list(core: State<'_, Core>) -> Result<Vec<BinNote>> {
    notes::list_bin(&core.db).await
}

/// Deletes one binned note for good.
#[tauri::command]
pub async fn note_purge(id: String, core: State<'_, Core>) -> Result<()> {
    notes::purge(&core.db, &*core.clock, &id).await
}

/// Empties the Bin; returns how many notes were removed.
#[tauri::command]
pub async fn bin_empty(core: State<'_, Core>) -> Result<u64> {
    notes::empty_bin(&core.db, &*core.clock).await
}

#[tauri::command]
pub async fn note_discard_if_empty(id: String, core: State<'_, Core>) -> Result<bool> {
    notes::discard_if_empty(&core.db, &*core.clock, &id).await
}

// ---- reminders ------------------------------------------------------------------------------

#[tauri::command]
pub async fn reminders_list(include_done: bool, core: State<'_, Core>) -> Result<Vec<Reminder>> {
    reminders::list(&core.db, include_done).await
}

#[tauri::command]
pub async fn reminder_create(input: ReminderInput, core: State<'_, Core>) -> Result<Reminder> {
    reminders::create(&core.db, &*core.clock, input).await
}

#[tauri::command]
pub async fn reminder_update(
    id: String,
    patch: ReminderPatch,
    core: State<'_, Core>,
) -> Result<Reminder> {
    reminders::update(&core.db, &*core.clock, &id, patch).await
}

#[tauri::command]
pub async fn reminder_set_done(id: String, done: bool, core: State<'_, Core>) -> Result<Reminder> {
    reminders::set_done(&core.db, &*core.clock, &id, done).await
}

#[tauri::command]
pub async fn reminder_delete(id: String, core: State<'_, Core>) -> Result<()> {
    reminders::delete(&core.db, &*core.clock, &id).await
}

// ---- labels ---------------------------------------------------------------------------------

#[tauri::command]
pub async fn labels_list(core: State<'_, Core>) -> Result<Vec<LabelCount>> {
    labels::list(&core.db).await
}

#[tauri::command]
pub async fn label_create(name: String, core: State<'_, Core>) -> Result<Label> {
    labels::create(&core.db, &*core.clock, &name).await
}

#[tauri::command]
pub async fn label_rename(id: String, name: String, core: State<'_, Core>) -> Result<Label> {
    labels::rename(&core.db, &*core.clock, &id, &name).await
}

#[tauri::command]
pub async fn label_delete(id: String, core: State<'_, Core>) -> Result<()> {
    labels::delete(&core.db, &*core.clock, &id).await
}

// ---- tasks (the Today card; the full Tasks screen is CP1 UI) --------------------------------

#[tauri::command]
pub async fn tasks_query(
    view: TaskView,
    filters: Option<TaskFilters>,
    core: State<'_, Core>,
) -> Result<Vec<TaskRow>> {
    tasks::query(&core.db, &*core.clock, view, filters.unwrap_or_default()).await
}

#[tauri::command]
pub async fn task_quick_add(title: String, core: State<'_, Core>) -> Result<Task> {
    tasks::quick_add(&core.db, &*core.clock, &title).await
}

#[tauri::command]
pub async fn task_transition(id: String, to: TaskStatus, core: State<'_, Core>) -> Result<Task> {
    tasks::transition(&core.db, &*core.clock, &id, to).await
}

// ---- daily logs (the Time screen) -----------------------------------------------------------

/// The log for a local day `YYYY-MM-DD`: live for today, frozen for earlier days, `null` if none.
#[tauri::command]
pub async fn daily_log_get(date: String, core: State<'_, Core>) -> Result<Option<DailyLog>> {
    let day = chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|_| AppError::validation("date", "Dates look like 2026-10-04."))?;
    daily_log::get(&core.db, &*core.clock, day).await
}
