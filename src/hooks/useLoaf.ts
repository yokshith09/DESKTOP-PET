import { useEffect } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { daysAgo, ymd } from "@/lib/dates";
import { errorMessage, ipc, onEvent, type NoteInput, type NotePatch, type NoteSort, type TaskStatus } from "@/ipc";

export const keys = {
  notes: (archived: boolean, labelId: string | null, sort: NoteSort) => ["notes", archived, labelId, sort] as const,
  note: (id: string) => ["note", id] as const,
  labels: ["labels"] as const,
  tasks: ["tasks", "today"] as const,
  search: (q: string, archived: boolean) => ["notes", "search", q, archived] as const,
  bin: ["bin"] as const,
  log: (date: string) => ["log", date] as const,
  reminders: ["reminders"] as const,
  settings: ["settings"] as const,
};

/** Bus events -> cache invalidation. A lag notice (`ResyncRequired`) refetches everything. */
export function useBusSync() {
  const qc = useQueryClient();
  useEffect(
    () =>
      onEvent((e) => {
        if (e.type === "ResyncRequired") return void qc.invalidateQueries();
        if (e.type === "ReminderDue") {
          const r = e.reminder as { title?: string } | undefined;
          toast(r?.title ?? "Reminder", { description: "Reminder is due" });
        }
        if (e.type.startsWith("Reminder")) void qc.invalidateQueries({ queryKey: keys.reminders });
        if (e.type === "UsageUpdated") void qc.invalidateQueries({ queryKey: ["usage"] });
        if (e.type === "SettingChanged") void qc.invalidateQueries({ queryKey: ["tracking"] });
        if (e.type.startsWith("Note") || e.type === "LabelsChanged") {
          void qc.invalidateQueries({ queryKey: keys.bin });
          void qc.invalidateQueries({ queryKey: ["notes"] });
          void qc.invalidateQueries({ queryKey: ["note"] });
          void qc.invalidateQueries({ queryKey: keys.labels });
        }
        if (e.type.startsWith("Task") || e.type.startsWith("Note") || e.type === "DayRolledOver" || e.type === "DailyLogFrozen") {
          void qc.invalidateQueries({ queryKey: ["log"] });
        }
        if (e.type.startsWith("Task")) void qc.invalidateQueries({ queryKey: ["tasks"] });
        if (e.type === "SettingChanged") void qc.invalidateQueries({ queryKey: keys.settings });
      }),
    [qc],
  );
}

export const useNotes = (archived: boolean, labelId: string | null, sort: NoteSort) =>
  useQuery({ queryKey: keys.notes(archived, labelId, sort), queryFn: () => ipc.notesList(archived, labelId, sort) });
export const useSearch = (q: string, archived: boolean) =>
  useQuery({ queryKey: keys.search(q, archived), queryFn: () => ipc.notesSearch(q, archived), enabled: q.trim().length > 0 });
export const useDailyLog = (date: string) =>
  useQuery({ queryKey: keys.log(date), queryFn: () => ipc.dailyLogGet(date) });

/** Logs for the last `n` days, oldest first (today is last). Missing days are null. */
export function useRecentLogs(n: number) {
  const days = Array.from({ length: n }, (_, i) => daysAgo(n - 1 - i));
  const results = useQueries({ queries: days.map((d) => ({ queryKey: keys.log(ymd(d)), queryFn: () => ipc.dailyLogGet(ymd(d)) })) });
  return days.map((d, i) => ({ date: d, log: results[i]?.data ?? null }));
}
export const useBin = () => useQuery({ queryKey: keys.bin, queryFn: ipc.binList });
export const useReminders = (includeDone = false) =>
  useQuery({ queryKey: [...keys.reminders, includeDone], queryFn: () => ipc.remindersList(includeDone) });
export const useLabels = () => useQuery({ queryKey: keys.labels, queryFn: ipc.labelsList });
export const useTodayTasks = () => useQuery({ queryKey: keys.tasks, queryFn: () => ipc.tasksQuery("today") });
export const useUpcomingTasks = () => useQuery({ queryKey: ["tasks", "upcoming"], queryFn: () => ipc.tasksQuery("upcoming") });
export const useTrackingStatus = () => useQuery({ queryKey: ["tracking", "status"], queryFn: ipc.trackingStatus });
export const useUsage = (from: number, to: number) =>
  useQuery({ queryKey: ["usage", from, to], queryFn: () => ipc.usageSummary(from, to), refetchInterval: false });
export const useAllTasks = () => useQuery({ queryKey: ["tasks", "all"], queryFn: () => ipc.tasksQuery("all") });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: ipc.settingsGetAll });

function useAction<A extends unknown[], R>(fn: (...a: A) => Promise<R>, invalidate: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: A) => fn(...a),
    onSuccess: () => invalidate.forEach((k) => void qc.invalidateQueries({ queryKey: k })),
    onError: (e) => toast.error(errorMessage(e)),
  });
}

const NOTE_KEYS = [["notes"], ["note"], ["labels"], ["bin"]] as const;

export function useNoteActions() {
  const create = useAction((input: NoteInput) => ipc.noteCreate(input), NOTE_KEYS);
  const update = useAction((id: string, patch: NotePatch) => ipc.noteUpdate(id, patch), NOTE_KEYS);
  const pin = useAction((id: string, pinned: boolean) => ipc.noteSetPinned(id, pinned), NOTE_KEYS);
  const archive = useAction((id: string, archived: boolean) => ipc.noteSetArchived(id, archived), NOTE_KEYS);
  const remove = useAction((id: string) => ipc.noteDelete(id), NOTE_KEYS);
  const restore = useAction((id: string) => ipc.noteRestore(id), NOTE_KEYS);
  const purge = useAction((id: string) => ipc.notePurge(id), NOTE_KEYS);
  const emptyBin = useAction(() => ipc.binEmpty(), NOTE_KEYS);
  const discard = useAction((id: string) => ipc.noteDiscardIfEmpty(id), NOTE_KEYS);
  const createLabel = useAction((name: string) => ipc.labelCreate(name), [["labels"]]);
  return {
    create: (input: NoteInput = {}) => create.mutateAsync([input]),
    update: (id: string, patch: NotePatch) => update.mutateAsync([id, patch]),
    pin: (id: string, pinned: boolean) => pin.mutateAsync([id, pinned]),
    archive: (id: string, archived: boolean) => archive.mutateAsync([id, archived]),
    /** Deletes, then offers Undo (restores the exact snapshot). */
    remove: async (id: string) => {
      const gone = await remove.mutateAsync([id]);
      toast("Moved to Bin", { action: { label: "Undo", onClick: () => void restore.mutateAsync([gone.id]) } });
    },
    restore: (id: string) => restore.mutateAsync([id]),
    purge: (id: string) => purge.mutateAsync([id]),
    emptyBin: () => emptyBin.mutateAsync([]),
    discardIfEmpty: (id: string) => discard.mutateAsync([id]),
    createLabel: (name: string) => createLabel.mutateAsync([name]),
  };
}

export function useTaskActions() {
  const quickAdd = useAction((title: string) => ipc.taskQuickAdd(title), [["tasks"]]);
  const move = useAction((id: string, to: TaskStatus) => ipc.taskTransition(id, to), [["tasks"]]);
  return {
    quickAdd: (title: string) => quickAdd.mutateAsync([title]),
    setDone: (id: string, done: boolean) => move.mutateAsync([id, done ? "COMPLETED" : "PLANNED"]),
  };
}

export function useReminderActions() {
  const keysToRefresh = [["reminders"]] as const;
  const create = useAction((title: string, remindAt: number) => ipc.reminderCreate({ title, remind_at: remindAt }), keysToRefresh);
  const done = useAction((id: string, d: boolean) => ipc.reminderSetDone(id, d), keysToRefresh);
  const remove = useAction((id: string) => ipc.reminderDelete(id), keysToRefresh);
  return {
    create: (title: string, remindAt: number) => create.mutateAsync([title, remindAt]),
    setDone: (id: string, d: boolean) => done.mutateAsync([id, d]),
    remove: (id: string) => remove.mutateAsync([id]),
  };
}
