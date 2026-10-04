// In-memory stand-in for the Rust shell, used only by `vite dev` outside Tauri.
import type {
  AppError, BinNote, DailyLog, LogEntry, Reminder, Label, LoafEvent, Note, NoteColor, NoteSummary, Task, TaskRow, TaskStatus,
} from "./types";

type Args = Record<string, unknown> | undefined;

const HOUR = 3_600_000;

export function createMock() {
  let seq = 100;
  const now = () => Date.now();
  const listeners = new Set<(e: LoafEvent) => void>();
  const emit = (type: string) => listeners.forEach((l) => l({ type, at: now() }));
  const fail = (code: AppError["code"], message: string): never => {
    throw { code, message } satisfies AppError;
  };

  const labels: Label[] = [
    { id: "l1", name: "product" }, { id: "l2", name: "ideas" }, { id: "l3", name: "work" },
    { id: "l4", name: "home" }, { id: "l5", name: "pet" },
  ];
  const L = (...ids: string[]) => labels.filter((l) => ids.includes(l.id));
  const n = (
    id: string, title: string, body: string, color: NoteColor, hoursAgo: number,
    ls: Label[], pinned = false,
  ): Note => ({
    id, title, body, color, pinned, archived: false, labels: ls,
    created_at: now() - hoursAgo * HOUR, edited_at: now() - hoursAgo * HOUR,
  });
  const notes: Note[] = [
    n("n1", "Loaf v1 scope", "Notes, tasks, meetings and daily logs.\nEverything stays on this computer — no account, no cloud.", "orange", 2, L("l1"), true),
    n("n2", "Shortcuts I want", "Ctrl+N  new note\nCtrl+1…5  jump between views\nEsc  close the editor", "blue", 5, L("l2"), true),
    n("n3", "Bear animations", "Idle bob, a wave when a note is saved, sleepy after ten idle minutes. Keep every sprite under 64 KB.", "teal", 9, L("l5"), true),
    n("n4", "Groceries", "Oats\nPeanut butter\nBananas\nCoffee beans\nHoney", "yellow", 26, L("l4")),
    n("n5", "Friday prep", "Questions for the review:\n- budget for Q4\n- who owns the roadmap\n- launch timeline", "purple", 30, L("l3")),
    n("n6", "Reading list", "Designing Data-Intensive Applications\nThe Pragmatic Programmer\nA Philosophy of Software Design", "default", 50, []),
    n("n7", "Idea: weekly review", "A note that builds itself from the week's daily logs: what shipped, what slipped, what to carry over.", "green", 70, L("l2")),
    n("n8", "Release checklist", "☐ changelog\n☐ sign installer\n☐ smoke test on Windows\n☐ smoke test on macOS", "red", 96, L("l1", "l3")),
    n("n9", "Poem for the bear", "Round as a loaf and warm as toast,\nthe quiet one who guards your most\nimportant thoughts.", "default", 120, [], false),
  ];
  const bin: BinNote[] = [
    { ...summary(n("b1", "Old grocery list", "Milk, eggs, bread", "default", 30, [])), deleted_at: now() - 26 * HOUR },
    { ...summary(n("b2", "Draft: release notes", "v0.1 — first public build", "blue", 80, L("l1"))), deleted_at: now() - 3 * 24 * HOUR },
  ];
  const reminders: Reminder[] = [
    { id: "r0", title: "Review the sync PR", remind_at: now() - 40 * 60_000, note_id: null, fired_at: now() - 40 * 60_000, done_at: null, created_at: now() },
    { id: "r1", title: "Stand-up", remind_at: now() + 1.5 * HOUR, note_id: null, fired_at: null, done_at: null, created_at: now() },
    { id: "r2", title: "Call the dentist", remind_at: now() + 20 * HOUR, note_id: null, fired_at: null, done_at: null, created_at: now() },
    { id: "r3", title: "Send invoice", remind_at: now() + 3 * 24 * HOUR, note_id: null, fired_at: null, done_at: null, created_at: now() },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const tasks: Task[] = [
    t("t1", "Design the notes screen", "HIGH", today, null, "IN_PROGRESS"),
    t("t2", "Finish the sync spec", "MEDIUM", null, "2000-01-01", "PLANNED"),
    t("t3", "Refactor the tray menu", "LOW", today, null, "PLANNED"),
    t("t4", "Reply to Sam", null, today, null, "COMPLETED"),
  ];
  function t(id: string, title: string, priority: Task["priority"], planned: string | null, due: string | null, status: TaskStatus): Task {
    return { id, title, description: "", status, priority, project: null, planned_date: planned, due_date: due, note_id: null, source_action_item_id: null, created_at: now(), updated_at: now(), started_at: null, completed_at: status === "COMPLETED" ? now() : null, cancelled_at: null };
  }

  function summary(x: Note): NoteSummary {
    const { body, ...rest } = x;
    return { ...rest, excerpt: body.slice(0, 200) };
  }
  const find = (id: unknown) => notes.find((x) => x.id === id) ?? fail("NOT_FOUND", "That note no longer exists.");

  const settings: Record<string, unknown> = {
    "general.autostart": false, "general.theme": "dark", "general.font_size": "M",
    "pet.visible": true, "pet.size": "M", "pet.opacity": 100, "pet.always_on_top": true,
    "shortcuts.global_open": null, "shortcuts.global_new_note": null, "shortcuts.global_new_task": null,
    "advanced.log_level": "info",
  };
  /** Deterministic sample history so the Time screen has something to show. */
  function sampleLog(date: string, back: number): DailyLog | null {
    if (back === 0) return liveLog(date);
    const seed = (back * 7 + 3) % 9;
    const planned = 4 + (seed % 5);
    const completed = Math.max(1, planned - (seed % 4));
    const hours = [9, 10, 11, 13, 14, 15, 16, 17, 20];
    const entry = (i: number, done: boolean): LogEntry => {
      const d = new Date(date + "T00:00:00");
      d.setHours(hours[(i + seed) % hours.length] ?? 10, (i * 17) % 60);
      return {
        id: `${date}-${i}`, title: ["Write the spec", "Review pull request", "Plan the week", "Inbox zero", "Fix the tray bug", "Draft release notes", "Prep the demo", "Refactor the store"][(i + seed) % 8] ?? "Task",
        priority: (["HIGH", "MEDIUM", "LOW"] as const)[(i + seed) % 3] ?? null,
        status_at_eod: done ? "COMPLETED" : "PLANNED", ...(done ? { completed_at: d.getTime() } : {}),
      };
    };
    const done = Array.from({ length: completed }, (_, i) => entry(i, true));
    const left = Array.from({ length: planned - completed }, (_, i) => entry(i + 20, false));
    return {
      date, live: false, reconstructed: back === 4,
      snapshot: {
        date, planned: left, in_progress: [], completed: done, pending: [], cancelled: [], overdue: [],
        stats: { planned_count: planned, completed_count: completed, completion_ratio: Math.round((completed / planned) * 100) / 100, tasks_created: planned, notes_created: seed % 3, notes_edited: (seed + 1) % 4, meetings: seed % 2 },
        activity: null,
      },
    };
  }
  function liveLog(date: string): DailyLog {
    const open = tasks.filter((x) => x.status !== "COMPLETED" && x.status !== "CANCELLED");
    const done = tasks.filter((x) => x.status === "COMPLETED");
    const asEntry = (x: Task): LogEntry => ({ id: x.id, title: x.title, priority: x.priority, status_at_eod: x.status, ...(x.completed_at ? { completed_at: x.completed_at } : {}) });
    const total = open.length + done.length;
    return {
      date, live: true, reconstructed: false,
      snapshot: {
        date, planned: open.filter((x) => x.status === "PLANNED").map(asEntry), in_progress: open.filter((x) => x.status === "IN_PROGRESS").map(asEntry),
        completed: done.map(asEntry), pending: [], cancelled: [], overdue: open.filter((x) => x.due_date && x.due_date < date).map(asEntry),
        stats: { planned_count: total, completed_count: done.length, completion_ratio: total ? Math.round((done.length / total) * 100) / 100 : null, tasks_created: total, notes_created: notes.filter((x) => x.created_at > now() - 12 * HOUR).length, notes_edited: 2, meetings: 0 },
        activity: null,
      },
    };
  }

  const handlers: Record<string, (a: Record<string, unknown>) => unknown> = {
    settings_get_all: () => settings,
    setting_set: (a) => { settings[String(a.key)] = a.value; emit("SettingChanged"); return null; },
    prefs_get: () => null,
    prefs_set: () => null,

    notes_list: (a) => {
      const sorted = notes
        .filter((x) => x.archived === a.archived && (!a.labelId || x.labels.some((l) => l.id === a.labelId)))
        .sort((p, q) => Number(!a.archived && q.pinned) - Number(!a.archived && p.pinned) || q.edited_at - p.edited_at);
      return sorted.map(summary);
    },
    note_get: (a) => find(a.id),
    note_create: (a) => {
      const i = (a.input ?? {}) as Partial<Note> & { label_ids?: string[] };
      const x = n(`n${++seq}`, i.title ?? "", i.body ?? "", i.color ?? "default", 0, L(...(i.label_ids ?? [])));
      notes.unshift(x);
      emit("NoteCreated");
      return x;
    },
    note_update: (a) => {
      const x = find(a.id);
      const p = a.patch as Partial<Note> & { label_ids?: string[] };
      if (p.title !== undefined) x.title = p.title;
      if (p.body !== undefined) x.body = p.body;
      if (p.color !== undefined) x.color = p.color;
      if (p.label_ids) x.labels = L(...p.label_ids);
      x.edited_at = now();
      emit("NoteUpdated");
      return x;
    },
    note_set_pinned: (a) => { const x = find(a.id); x.pinned = a.pinned as boolean; emit("NotePinnedChanged"); return x; },
    note_set_archived: (a) => { const x = find(a.id); x.archived = a.archived as boolean; emit("NoteArchivedChanged"); return x; },
    note_delete: (a) => {
      const x = find(a.id); notes.splice(notes.indexOf(x), 1);
      bin.unshift({ ...summary(x), deleted_at: now() }); emit("NoteDeleted"); return x;
    },
    note_restore: (a) => {
      const i = bin.findIndex((b) => b.id === a.id);
      if (i < 0) fail("NOT_FOUND", "That note is no longer in the Bin.");
      const [b] = bin.splice(i, 1);
      const x: Note = { ...(b as BinNote), body: (b as BinNote).excerpt, archived: false };
      notes.unshift(x); emit("NoteRestored"); return x;
    },
    note_discard_if_empty: (a) => {
      const x = find(a.id);
      if (x.title || x.body) return false;
      notes.splice(notes.indexOf(x), 1); emit("NoteDeleted"); return true;
    },
    notes_search: (a) => {
      const q = String(a.query).trim().toLowerCase();
      if (!q) return [];
      return notes
        .filter((x) => x.archived === a.archived && (x.title + " " + x.body).toLowerCase().includes(q))
        .sort((p, r) => r.edited_at - p.edited_at).map(summary);
    },
    bin_list: () => bin,
    note_purge: (a) => { const i = bin.findIndex((b) => b.id === a.id); if (i >= 0) bin.splice(i, 1); emit("NotePurged"); return null; },
    bin_empty: () => { const c = bin.length; bin.length = 0; emit("NotePurged"); return c; },

    reminders_list: (a) =>
      reminders.filter((r) => a.includeDone || !r.done_at).sort((p, q) => Number(!!p.done_at) - Number(!!q.done_at) || p.remind_at - q.remind_at),
    reminder_create: (a) => {
      const i = a.input as { title: string; remind_at: number };
      if (!i.title.trim()) fail("VALIDATION", "A reminder needs a title.");
      const r: Reminder = { id: `r${++seq}`, title: i.title.trim(), remind_at: i.remind_at, note_id: null, fired_at: null, done_at: null, created_at: now() };
      reminders.push(r); emit("ReminderCreated"); return r;
    },
    reminder_update: (a) => {
      const r = reminders.find((x) => x.id === a.id) ?? fail("NOT_FOUND", "That reminder no longer exists.");
      Object.assign(r, a.patch); emit("ReminderUpdated"); return r;
    },
    reminder_set_done: (a) => {
      const r = reminders.find((x) => x.id === a.id) ?? fail("NOT_FOUND", "That reminder no longer exists.");
      r.done_at = a.done ? now() : null; emit("ReminderUpdated"); return r;
    },
    reminder_delete: (a) => { const i = reminders.findIndex((x) => x.id === a.id); if (i >= 0) reminders.splice(i, 1); emit("ReminderDeleted"); return null; },

    labels_list: () => labels.map((label) => ({ label, count: notes.filter((x) => !x.archived && x.labels.some((l) => l.id === label.id)).length })),
    label_create: (a) => {
      const name = String(a.name).trim();
      if (!name) fail("VALIDATION", "A label needs a name.");
      const l = { id: `l${++seq}`, name }; labels.push(l); emit("LabelsChanged"); return l;
    },
    label_rename: () => fail("INTERNAL", "Not in the mock."),
    label_delete: () => fail("INTERNAL", "Not in the mock."),

    tasks_query: () => tasks.filter((x) => x.status !== "CANCELLED" && x.status !== "COMPLETED").map<TaskRow>((task) => ({ task, overdue: !!task.due_date && task.due_date < today && task.status !== "COMPLETED" })),
    task_quick_add: (a) => { const x = t(`t${++seq}`, String(a.title), null, today, null, "PLANNED"); tasks.push(x); emit("TaskCreated"); return x; },
    daily_log_get: (a) => {
      const d = new Date(String(a.date) + "T00:00:00");
      const back = Math.round((new Date(today + "T00:00:00").getTime() - d.getTime()) / 86_400_000);
      return back < 0 || back > 20 ? null : sampleLog(String(a.date), back);
    },
    task_transition: (a) => {
      const x = tasks.find((y) => y.id === a.id) ?? fail("NOT_FOUND", "That task no longer exists.");
      x.status = a.to as TaskStatus; x.completed_at = x.status === "COMPLETED" ? now() : null;
      emit("TaskStatusChanged"); return x;
    },
  };

  return {
    call: async (cmd: string, args: Args) => {
      const h = handlers[cmd] ?? (() => fail("INTERNAL", `Unknown command ${cmd}`));
      return structuredClone(h(args ?? {}));
    },
    subscribe: (cb: (e: LoafEvent) => void) => { listeners.add(cb); return () => void listeners.delete(cb); },
  };
}
