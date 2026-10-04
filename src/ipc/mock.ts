// In-memory stand-in for the Rust shell, used only by `vite dev` outside Tauri.
import type {
  AppError, Label, LoafEvent, Note, NoteColor, NoteSummary, Task, TaskRow, TaskStatus,
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
  const today = new Date().toISOString().slice(0, 10);
  const tasks: Task[] = [
    t("t1", "Design the notes screen", "HIGH", today, null, "IN_PROGRESS"),
    t("t2", "Finish the sync spec", "MEDIUM", null, "2000-01-01", "PLANNED"),
    t("t3", "Refactor the tray menu", "LOW", today, null, "PLANNED"),
    t("t4", "Reply to Sam", null, today, null, "COMPLETED"),
  ];
  function t(id: string, title: string, priority: Task["priority"], planned: string | null, due: string | null, status: TaskStatus): Task {
    return { id, title, description: "", status, priority, project: null, planned_date: planned, due_date: due, created_at: now(), updated_at: now(), completed_at: status === "COMPLETED" ? now() : null };
  }

  const summary = (x: Note): NoteSummary => {
    const { body, ...rest } = x;
    return { ...rest, excerpt: body.slice(0, 200) };
  };
  const find = (id: unknown) => notes.find((x) => x.id === id) ?? fail("NOT_FOUND", "That note no longer exists.");

  const settings: Record<string, unknown> = {
    "general.autostart": false, "general.theme": "dark", "general.font_size": "M",
    "pet.visible": true, "pet.size": "M", "pet.opacity": 100, "pet.always_on_top": true,
    "shortcuts.global_open": null, "shortcuts.global_new_note": null, "shortcuts.global_new_task": null,
    "advanced.log_level": "info",
  };
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
    note_delete: (a) => { const x = find(a.id); notes.splice(notes.indexOf(x), 1); emit("NoteDeleted"); return x; },
    note_restore: (a) => { notes.unshift(a.note as Note); emit("NoteCreated"); return a.note; },
    note_discard_if_empty: (a) => {
      const x = find(a.id);
      if (x.title || x.body) return false;
      notes.splice(notes.indexOf(x), 1); emit("NoteDeleted"); return true;
    },

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
