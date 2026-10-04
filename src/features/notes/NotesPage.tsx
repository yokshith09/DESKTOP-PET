import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WeekCalendar } from "@/features/calendar/WeekCalendar";
import { PageHeader } from "@/features/shell/PageHeader";
import type { Page } from "@/features/shell/Sidebar";
import { useNoteActions, useNotes, useSearch } from "@/hooks/useLoaf";
import type { LabelCount, NoteSort } from "@/ipc";
import { NoteComposer } from "./NoteComposer";
import { NotesBoard, type NotesLayout } from "./NotesBoard";
import { TodayStrip } from "./TodayStrip";

const SORTS: Record<NoteSort, string> = { last_edited: "Last edited", created: "Date created", color: "Colour" };
const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

interface Props {
  archived: boolean;
  labelId: string | null;
  labelName?: string;
  labels: LabelCount[];
  onLabel: (id: string | null) => void;
  sort: NoteSort;
  layout: NotesLayout;
  onSort: (s: NoteSort) => void;
  onLayout: (l: NotesLayout) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onNavigate: (p: Page) => void;
}

/** Notes: search, new note and Ctrl/⌘ K / N live here and nowhere else. */
export function NotesPage({ archived, labelId, labelName, labels, onLabel, sort, layout, onSort, onLayout, onOpen, onNew, onNavigate }: Props) {
  const actions = useNoteActions();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (k === "n" && !archived) {
        e.preventDefault();
        onNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [archived, onNew]);

  const searching = debounced.trim().length > 0;
  const list = useNotes(archived, labelId, sort);
  const found = useSearch(debounced, archived);
  const notes = (searching ? found.data : list.data) ?? [];
  const mode = searching ? "search" : archived ? "archive" : labelId ? "label" : "notes";
  const title = searching ? `Results for “${debounced.trim()}”` : archived ? "Archive" : (labelName ?? "Notes");
  const description = searching ? `${notes.length} ${notes.length === 1 ? "match" : "matches"}${archived ? " in the Archive" : ""}` : undefined;

  return (
    <div className="space-y-6">
      {mode === "notes" && (
        <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-72">
          <TodayStrip className="lg:col-span-4" onViewAll={() => onNavigate("today")} />
          <WeekCalendar className="lg:col-span-8" />
        </div>
      )}
      <div>
        <PageHeader
          title={title}
          {...(description ? { description } : {})}
          actions={
            <>
              <label className="relative flex h-8 w-64 items-center">
                <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
                <input
                  ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
                  placeholder={archived ? "Search the Archive" : "Search notes"} aria-label="Search notes"
                  className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-14 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                {query ? (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent">
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <span className="pointer-events-none absolute right-2 flex gap-0.5"><Kbd>{mod}</Kbd><Kbd>K</Kbd></span>
                )}
              </label>
              {!searching && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8"><ArrowDownUp />{SORTS[sort]}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSort(v as NoteSort)}>
                      {(Object.keys(SORTS) as NoteSort[]).map((s) => (
                        <DropdownMenuRadioItem key={s} value={s}>{SORTS[s]}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ToggleGroup type="single" value={layout} onValueChange={(v) => v && onLayout(v as NotesLayout)} aria-label="Layout">
                <ToggleGroupItem value="grid" aria-label="Grid" className="min-w-8 px-0"><LayoutGrid className="size-3.5" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List" className="min-w-8 px-0"><List className="size-3.5" /></ToggleGroupItem>
              </ToggleGroup>
              {!archived && (
                <Button onClick={onNew}><Plus />New note<Kbd className="ml-1 border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground">{mod} N</Kbd></Button>
              )}
            </>
          }
        />
        {!archived && !searching && labels.length > 0 && (
          <div className="-mt-2 mb-5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by label">
            {[{ id: null as string | null, name: "All notes", count: undefined as number | undefined }, ...labels.map(({ label, count }) => ({ id: label.id as string | null, name: label.name, count }))].map((l) => (
              <button
                key={l.id ?? "all"} type="button" aria-pressed={labelId === l.id} onClick={() => onLabel(l.id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${labelId === l.id ? "border-primary/50 bg-primary/10 text-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {l.name}{l.count !== undefined && <span className="tabular-nums text-muted-foreground">{l.count}</span>}
              </button>
            ))}
          </div>
        )}
        {mode === "notes" && <NoteComposer className="mb-6 max-w-2xl" onOpenEditor={onNew} />}
        <NotesBoard
          notes={notes} layout={layout} mode={mode} onNew={onNew}
          onOpen={onOpen} onPin={(id, p) => void actions.pin(id, p)}
          onArchive={(id, a) => void actions.archive(id, a)} onDelete={(id) => void actions.remove(id)}
        />
      </div>
    </div>
  );
}
