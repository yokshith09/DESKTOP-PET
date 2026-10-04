import { Pin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bear } from "@/features/shell/Bear";
import type { NoteSummary } from "@/ipc";
import { NoteCard } from "./NoteCard";

interface Handlers {
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}

const COLUMNS = "gap-4 [columns:17rem]";

function Grid({ notes, ...h }: { notes: NoteSummary[] } & Handlers) {
  return (
    <div className={COLUMNS}>
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} {...h} />
      ))}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {icon}
      {children}
    </h2>
  );
}

export function NotesBoard({
  notes, archived, filtered, onNew, ...h
}: { notes: NoteSummary[]; archived: boolean; filtered: boolean; onNew: () => void } & Handlers) {
  if (notes.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed py-16 text-center">
        <Bear pose="sleep" className="mb-3 size-28 opacity-90" />
        <p className="max-w-sm text-balance text-muted-foreground">
          {archived
            ? "Archived notes live here. Archive a note to tuck it away without deleting it."
            : filtered
              ? "No notes with this label yet."
              : "Notes you write live here. Press Ctrl+N to start one."}
        </p>
        {!archived && !filtered && (
          <Button className="mt-5" onClick={onNew}><Plus />New note</Button>
        )}
      </div>
    );
  }
  const pinned = archived ? [] : notes.filter((n) => n.pinned);
  const rest = archived ? notes : notes.filter((n) => !n.pinned);
  return (
    <div className="space-y-8">
      {pinned.length > 0 && (
        <section aria-label="Pinned notes">
          <SectionTitle icon={<Pin className="size-3.5 rotate-45" />}>Pinned</SectionTitle>
          <Grid notes={pinned} {...h} />
        </section>
      )}
      {rest.length > 0 && (
        <section aria-label={pinned.length ? "Other notes" : "Notes"}>
          {pinned.length > 0 && <SectionTitle>Others</SectionTitle>}
          <Grid notes={rest} {...h} />
        </section>
      )}
    </div>
  );
}
