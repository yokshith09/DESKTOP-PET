//! IPC command handlers. Thin: deserialize, call `loaf-core`, return. Errors cross the boundary
//! as `AppError` (`{ code, message, field? }`).

use std::collections::BTreeMap;
use std::sync::Arc;

use loaf_core::error::Result;
use loaf_core::labels::{self, Label, LabelCount};
use loaf_core::notes::{self, Note, NoteInput, NotePatch, NoteSort, NoteSummary};
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

/// Returns the deleted note so the UI can offer Undo via `note_restore`.
#[tauri::command]
pub async fn note_delete(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::delete(&core.db, &*core.clock, &id).await
}

#[tauri::command]
pub async fn note_restore(note: Note, core: State<'_, Core>) -> Result<Note> {
    notes::restore(&core.db, &*core.clock, note).await
}

#[tauri::command]
pub async fn note_discard_if_empty(id: String, core: State<'_, Core>) -> Result<bool> {
    notes::discard_if_empty(&core.db, &*core.clock, &id).await
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
