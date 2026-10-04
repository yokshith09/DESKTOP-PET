import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage, ipc, onEvent, type NoteInput, type NotePatch, type NoteSort, type TaskStatus } from "@/ipc";

export const keys = {
  notes: (archived: boolean, labelId: string | null, sort: NoteSort) => ["notes", archived, labelId, sort] as const,
  note: (id: string) => ["note", id] as const,
  labels: ["labels"] as const,
  tasks: ["tasks", "today"] as const,
  settings: ["settings"] as const,
};

/** Bus events -> cache invalidation. A lag notice (`ResyncRequired`) refetches everything. */
export function useBusSync() {
  const qc = useQueryClient();
  useEffect(
    () =>
      onEvent((e) => {
        if (e.type === "ResyncRequired") return void qc.invalidateQueries();
        if (e.type.startsWith("Note") || e.type === "LabelsChanged") {
          void qc.invalidateQueries({ queryKey: ["notes"] });
          void qc.invalidateQueries({ queryKey: ["note"] });
          void qc.invalidateQueries({ queryKey: keys.labels });
        }
        if (e.type.startsWith("Task")) void qc.invalidateQueries({ queryKey: ["tasks"] });
        if (e.type === "SettingChanged") void qc.invalidateQueries({ queryKey: keys.settings });
      }),
    [qc],
  );
}

export const useNotes = (archived: boolean, labelId: string | null, sort: NoteSort) =>
  useQuery({ queryKey: keys.notes(archived, labelId, sort), queryFn: () => ipc.notesList(archived, labelId, sort) });
export const useLabels = () => useQuery({ queryKey: keys.labels, queryFn: ipc.labelsList });
export const useTodayTasks = () => useQuery({ queryKey: keys.tasks, queryFn: () => ipc.tasksQuery("today") });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: ipc.settingsGetAll });

function useAction<A extends unknown[], R>(fn: (...a: A) => Promise<R>, invalidate: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: A) => fn(...a),
    onSuccess: () => invalidate.forEach((k) => void qc.invalidateQueries({ queryKey: k })),
    onError: (e) => toast.error(errorMessage(e)),
  });
}

const NOTE_KEYS = [["notes"], ["note"], ["labels"]] as const;

export function useNoteActions() {
  const create = useAction((input: NoteInput) => ipc.noteCreate(input), NOTE_KEYS);
  const update = useAction((id: string, patch: NotePatch) => ipc.noteUpdate(id, patch), NOTE_KEYS);
  const pin = useAction((id: string, pinned: boolean) => ipc.noteSetPinned(id, pinned), NOTE_KEYS);
  const archive = useAction((id: string, archived: boolean) => ipc.noteSetArchived(id, archived), NOTE_KEYS);
  const remove = useAction((id: string) => ipc.noteDelete(id), NOTE_KEYS);
  const restore = useAction((note: Awaited<ReturnType<typeof ipc.noteDelete>>) => ipc.noteRestore(note), NOTE_KEYS);
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
      toast("Note deleted", { action: { label: "Undo", onClick: () => void restore.mutateAsync([gone]) } });
    },
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
