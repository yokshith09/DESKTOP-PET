import type { KeyboardEvent, MouseEvent } from "react";
import { Archive, ArchiveRestore, Pin, PinOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import type { NoteSummary } from "@/ipc";

interface Props {
  note: NoteSummary;
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}

function Action({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
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
        "grid size-8 place-items-center rounded-full text-foreground/60 outline-none transition-colors hover:bg-foreground/12 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
        danger && "hover:bg-destructive/20 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

export function NoteCard({ note, onOpen, onPin, onArchive, onDelete }: Props) {
  const tinted = note.color !== "default";
  const open = () => onOpen(note.id);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={note.title || "Untitled note"}
      data-note-color={note.color}
      onClick={open}
      onKeyDown={onKey}
      className={cn(
        "group relative mb-4 block cursor-pointer break-inside-avoid rounded-2xl border p-4 text-left outline-none transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 focus-visible:ring-2 focus-visible:ring-ring",
        tinted ? "note-tint" : "bg-card",
      )}
    >
      {note.pinned && !note.archived && (
        <Pin aria-label="Pinned" className="absolute right-3.5 top-3.5 size-4 rotate-45 fill-primary text-primary" />
      )}
      {note.title && <h3 className="mb-1.5 pr-6 text-[15px] font-semibold leading-snug tracking-tight">{note.title}</h3>}
      {note.excerpt && (
        <p className="line-clamp-8 whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/80">{note.excerpt}</p>
      )}
      {!note.title && !note.excerpt && <p className="text-sm italic text-muted-foreground">Empty note</p>}
      {note.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.labels.map((l) => (
            <Badge key={l.id}>{l.name}</Badge>
          ))}
        </div>
      )}
      <div className="mt-3 flex h-8 items-center">
        <span className="text-xs text-foreground/50 group-hover:hidden group-focus-within:hidden">{timeAgo(note.edited_at)}</span>
        <div className="-ml-1.5 hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
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
      </div>
    </article>
  );
}
