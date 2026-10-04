import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Archive, ArchiveRestore, Pin, PinOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import type { NoteSummary } from "@/ipc";

export interface NoteHandlers {
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}

function Action({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  const handle = (e: MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={handle}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "grid size-6 place-items-center rounded text-muted-foreground outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5",
        danger && "hover:bg-destructive/15 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function Actions({ note, onPin, onArchive, onDelete }: NoteHandlers & { note: NoteSummary }) {
  return (
    <div className="flex items-center gap-0.5">
      {!note.archived && (
        <Action label={note.pinned ? "Unpin" : "Pin"} onClick={() => onPin(note.id, !note.pinned)}>
          {note.pinned ? <PinOff /> : <Pin />}
        </Action>
      )}
      <Action label={note.archived ? "Unarchive" : "Archive"} onClick={() => onArchive(note.id, !note.archived)}>
        {note.archived ? <ArchiveRestore /> : <Archive />}
      </Action>
      <Action label="Delete" danger onClick={() => onDelete(note.id)}>
        <Trash2 />
      </Action>
    </div>
  );
}

function useOpen(id: string, onOpen: (id: string) => void) {
  return {
    onClick: () => onOpen(id),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen(id);
      }
    },
  };
}

export function NoteCard({ note, ...h }: { note: NoteSummary } & NoteHandlers) {
  const open = useOpen(note.id, h.onOpen);
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={note.title || "Untitled note"}
      data-note-color={note.color}
      {...open}
      className={cn(
        "group relative mb-3 block cursor-pointer break-inside-avoid rounded-xl border p-3.5 text-left outline-none transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring",
        note.color === "default" ? "bg-card" : "note-tint",
      )}
    >
      <div className="absolute right-2 top-2 hidden rounded-md border bg-popover/95 p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
        <Actions note={note} {...h} />
      </div>
      {note.pinned && !note.archived && (
        <Pin aria-label="Pinned" className="absolute right-3 top-3 size-3.5 rotate-45 fill-primary text-primary group-hover:hidden group-focus-within:hidden" />
      )}
      {note.title && <h3 className="mb-1 pr-5 text-[14px] font-semibold leading-snug tracking-tight">{note.title}</h3>}
      {note.excerpt && <p className="line-clamp-6 whitespace-pre-line text-[13px] leading-[1.55] text-foreground/75">{note.excerpt}</p>}
      {!note.title && !note.excerpt && <p className="text-[13px] italic text-muted-foreground">Empty note</p>}
      <div className="mt-3 flex items-center gap-1.5">
        {note.labels.slice(0, 3).map((l) => (
          <Badge key={l.id}>{l.name}</Badge>
        ))}
        {note.labels.length > 3 && <span className="text-[11px] text-muted-foreground">+{note.labels.length - 3}</span>}
        <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(note.edited_at)}</span>
      </div>
    </article>
  );
}

export function NoteRow({ note, ...h }: { note: NoteSummary } & NoteHandlers) {
  const open = useOpen(note.id, h.onOpen);
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={note.title || "Untitled note"}
      data-note-color={note.color}
      {...open}
      className="group relative flex h-11 cursor-pointer items-center gap-3 px-4 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/60"
    >
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", note.color === "default" ? "bg-border" : "note-dot")} />
      <span className="w-56 shrink-0 truncate text-[13px] font-medium">{note.title || "Untitled"}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{note.excerpt.replace(/\s+/g, " ")}</span>
      <span className="hidden items-center gap-1.5 lg:flex">
        {note.labels.slice(0, 2).map((l) => (
          <Badge key={l.id}>{l.name}</Badge>
        ))}
      </span>
      {note.pinned && !note.archived && <Pin aria-label="Pinned" className="size-3.5 rotate-45 fill-primary text-primary group-hover:hidden group-focus-within:hidden" />}
      <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground group-hover:hidden group-focus-within:hidden">{timeAgo(note.edited_at)}</span>
      <div className="hidden w-20 shrink-0 justify-end group-hover:flex group-focus-within:flex">
        <Actions note={note} {...h} />
      </div>
    </article>
  );
}
