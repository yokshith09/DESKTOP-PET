import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Check, Palette, Pin, PinOff, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { ipc, NOTE_COLORS, type Note, type NoteColor } from "@/ipc";
import { keys, useLabels, useNoteActions } from "@/hooks/useLoaf";
import { COLOR_NAMES } from "./colors";

const TITLE_MAX = 200;
const BODY_MAX = 100_000;

export function NoteEditor({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const { data: note } = useQuery({
    queryKey: noteId ? keys.note(noteId) : ["note", "none"],
    queryFn: () => ipc.noteGet(noteId ?? ""),
    enabled: noteId !== null,
  });
  return (
    <Dialog open={noteId !== null} onOpenChange={(o) => !o && onClose()}>
      {note && noteId === note.id && <EditorBody key={note.id} note={note} onClose={onClose} />}
    </Dialog>
  );
}

function EditorBody({ note, onClose }: { note: Note; onClose: () => void }) {
  const actions = useNoteActions();
  const { data: labelCounts = [] } = useLabels();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [status, setStatus] = useState<"saved" | "saving">("saved");
  const [newLabel, setNewLabel] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef({ title, body });
  latest.current = { title, body };
  const dirty = useRef(false);

  const flush = async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    await actions.update(note.id, latest.current);
    setStatus("saved");
  };
  const edit = (next: { title?: string; body?: string }) => {
    if (next.title !== undefined) setTitle(next.title);
    if (next.body !== undefined) setBody(next.body);
    dirty.current = true;
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 500);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const close = async () => {
    await flush();
    await actions.discardIfEmpty(note.id);
    onClose();
  };
  const labelIds = note.labels.map((l) => l.id);
  const toggleLabel = (id: string) =>
    void actions.update(note.id, { label_ids: labelIds.includes(id) ? labelIds.filter((x) => x !== id) : [...labelIds, id] });
  const addLabel = async () => {
    const name = newLabel.trim();
    if (!name) return;
    const label = await actions.createLabel(name);
    setNewLabel("");
    await actions.update(note.id, { label_ids: [...labelIds, label.id] });
  };

  return (
    <DialogContent
      data-note-color={note.color}
      aria-describedby="note-editor-desc"
      onInteractOutside={(e) => {
        e.preventDefault();
        void close();
      }}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        void close();
      }}
      showClose={false}
      className={cn("gap-0 overflow-hidden", note.color !== "default" && "note-tint")}
    >
      <DialogTitle className="sr-only">Edit note</DialogTitle>
      <DialogDescription id="note-editor-desc" className="sr-only">Changes save automatically.</DialogDescription>
      <div className="flex flex-col gap-1 px-6 pb-2 pt-6">
        <Input
          autoFocus={!note.title && !note.body ? true : undefined}
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => edit({ title: e.target.value })}
          placeholder="Title"
          aria-label="Title"
          className="h-auto border-0 bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
        />
        <textarea
          value={body}
          maxLength={BODY_MAX}
          onChange={(e) => edit({ body: e.target.value })}
          placeholder="Take a note…"
          aria-label="Note"
          className="max-h-[50vh] min-h-64 resize-none overflow-y-auto bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        {note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {note.labels.map((l) => (
              <button
                key={l.id}
                type="button"
                title={`Remove “${l.name}”`}
                onClick={() => toggleLabel(l.id)}
                className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium hover:bg-foreground/20"
              >
                {l.name} ×
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 border-t border-foreground/10 px-4 py-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Colour" title="Colour"><Palette /></Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto">
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Note colour">
              {NOTE_COLORS.map((c: NoteColor) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={note.color === c}
                  aria-label={COLOR_NAMES[c]}
                  title={COLOR_NAMES[c]}
                  data-note-color={c}
                  onClick={() => void actions.update(note.id, { color: c })}
                  className={cn(
                    "note-dot grid size-8 place-items-center rounded-full outline-none ring-offset-2 ring-offset-popover focus-visible:ring-2 focus-visible:ring-ring",
                    c === "default" && "!bg-secondary",
                    note.color === c && "ring-2 ring-foreground/70",
                  )}
                >
                  {note.color === c && <Check className="size-4 text-background" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Labels" title="Labels"><Tag /></Button>
          </PopoverTrigger>
          <PopoverContent side="top">
            <ul className="mb-2 max-h-48 space-y-0.5 overflow-y-auto">
              {labelCounts.map(({ label }) => (
                <li key={label.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-foreground/8">
                    <Checkbox checked={labelIds.includes(label.id)} onCheckedChange={() => toggleLabel(label.id)} className="rounded-md" />
                    <span className="truncate">{label.name}</span>
                  </label>
                </li>
              ))}
              {labelCounts.length === 0 && <li className="px-2 py-1.5 text-muted-foreground">No labels yet.</li>}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void addLabel();
              }}
            >
              <Input value={newLabel} maxLength={50} onChange={(e) => setNewLabel(e.target.value)} placeholder="New label" aria-label="New label" className="h-8" />
              <Button type="submit" size="icon-sm" variant="secondary" aria-label="Add label"><Plus /></Button>
            </form>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon-sm" aria-label={note.pinned ? "Unpin" : "Pin"} title={note.pinned ? "Unpin" : "Pin"} onClick={() => void actions.pin(note.id, !note.pinned)}>
          {note.pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={note.archived ? "Unarchive" : "Archive"} title={note.archived ? "Unarchive" : "Archive"} onClick={() => void actions.archive(note.id, !note.archived).then(onClose)}>
          {note.archived ? <ArchiveRestore /> : <Archive />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Delete" title="Delete" className="hover:text-destructive" onClick={() => void actions.remove(note.id).then(onClose)}>
          <Trash2 />
        </Button>
        <span className="ml-auto mr-2 text-xs text-foreground/50" aria-live="polite">
          {status === "saving" ? "Saving…" : `Edited ${timeAgo(note.edited_at)}`}
        </span>
        <Button size="sm" onClick={() => void close()}>Done</Button>
      </div>
    </DialogContent>
  );
}
