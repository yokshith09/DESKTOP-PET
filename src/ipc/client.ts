// Typed IPC client (F0-07): the only place that knows command names and argument shapes.
import { call } from "./transport";
import type {
  Label, LabelCount, Note, NoteInput, NotePatch, NoteSort, NoteSummary, Task, TaskRow,
  TaskStatus, TaskView,
} from "./types";
import type { Settings, SettingsKey } from "./settings";

export const ipc = {
  settingsGetAll: () => call<Settings>("settings_get_all"),
  settingSet: <K extends SettingsKey>(key: K, value: Settings[K]) =>
    call<unknown>("setting_set", { key, value }),
  prefsGet: <T = unknown>(key: string) => call<T | null>("prefs_get", { key }),
  prefsSet: <T>(key: string, value: T) => call<unknown>("prefs_set", { key, value }),

  notesList: (archived: boolean, labelId: string | null, sort: NoteSort = "last_edited") =>
    call<NoteSummary[]>("notes_list", { archived, labelId, sort }),
  noteGet: (id: string) => call<Note>("note_get", { id }),
  noteCreate: (input: NoteInput = {}) => call<Note>("note_create", { input }),
  noteUpdate: (id: string, patch: NotePatch) => call<Note>("note_update", { id, patch }),
  noteSetPinned: (id: string, pinned: boolean) => call<Note>("note_set_pinned", { id, pinned }),
  noteSetArchived: (id: string, archived: boolean) =>
    call<Note>("note_set_archived", { id, archived }),
  noteDelete: (id: string) => call<Note>("note_delete", { id }),
  noteRestore: (note: Note) => call<Note>("note_restore", { note }),
  noteDiscardIfEmpty: (id: string) => call<boolean>("note_discard_if_empty", { id }),

  labelsList: () => call<LabelCount[]>("labels_list"),
  labelCreate: (name: string) => call<Label>("label_create", { name }),
  labelRename: (id: string, name: string) => call<Label>("label_rename", { id, name }),
  labelDelete: (id: string) => call<unknown>("label_delete", { id }),

  tasksQuery: (view: TaskView) => call<TaskRow[]>("tasks_query", { view }),
  taskQuickAdd: (title: string) => call<Task>("task_quick_add", { title }),
  taskTransition: (id: string, to: TaskStatus) => call<Task>("task_transition", { id, to }),
};
