// Typed IPC client (F0-07): the only place that knows command names and argument shapes.
import { call } from "./transport";
import type {
  UsageSummary, TimeRange, TrackingStatus, BinNote, DailyLog, Reminder, ReminderInput, ReminderPatch, Label, LabelCount, Note, NoteInput, NotePatch, NoteSort, NoteSummary, Task, TaskRow,
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
  noteRestore: (id: string) => call<Note>("note_restore", { id }),
  notesSearch: (query: string, archived: boolean) => call<NoteSummary[]>("notes_search", { query, archived }),
  binList: () => call<BinNote[]>("bin_list"),
  notePurge: (id: string) => call<unknown>("note_purge", { id }),
  binEmpty: () => call<number>("bin_empty"),

  remindersList: (includeDone: boolean) => call<Reminder[]>("reminders_list", { includeDone }),
  reminderCreate: (input: ReminderInput) => call<Reminder>("reminder_create", { input }),
  reminderUpdate: (id: string, patch: ReminderPatch) => call<Reminder>("reminder_update", { id, patch }),
  reminderSetDone: (id: string, done: boolean) => call<Reminder>("reminder_set_done", { id, done }),
  reminderDelete: (id: string) => call<unknown>("reminder_delete", { id }),
  noteDiscardIfEmpty: (id: string) => call<boolean>("note_discard_if_empty", { id }),

  labelsList: () => call<LabelCount[]>("labels_list"),
  labelCreate: (name: string) => call<Label>("label_create", { name }),
  labelRename: (id: string, name: string) => call<Label>("label_rename", { id, name }),
  labelDelete: (id: string) => call<unknown>("label_delete", { id }),

  tasksQuery: (view: TaskView) => call<TaskRow[]>("tasks_query", { view }),
  taskQuickAdd: (title: string) => call<Task>("task_quick_add", { title }),
  dailyLogGet: (date: string) => call<DailyLog | null>("daily_log_get", { date }),
  usageSummary: (from: number, to: number) => call<UsageSummary>("usage_summary", { from, to }),
  usageAppSessions: (app: string, from: number, to: number) => call<TimeRange[]>("usage_app_sessions", { app, from, to }),
  usageDomainSessions: (domain: string, from: number, to: number) => call<TimeRange[]>("usage_domain_sessions", { domain, from, to }),
  trackingStatus: () => call<TrackingStatus>("tracking_status"),
  usageDelete: (from: number | null, to: number | null) => call<unknown>("usage_delete", { from, to }),
  openUrl: (url: string) => call<unknown>("open_url", { url }),
  taskTransition: (id: string, to: TaskStatus) => call<Task>("task_transition", { id, to }),
};
