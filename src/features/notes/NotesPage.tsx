import { ArrowDownUp, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "@/features/shell/PageHeader";
import { TodayStrip } from "./TodayStrip";
import { useNoteActions, useNotes, useSearch } from "@/hooks/useLoaf";
import type { NoteSort } from "@/ipc";
import { NotesBoard, type NotesLayout } from "./NotesBoard";
import type { Page } from "@/features/shell/Sidebar";

const SORTS: Record<NoteSort, string> = { last_edited: "Last edited", created: "Date created", color: "Colour" };

interface Props {
  archived: boolean;
  labelId: string | null;
  labelName?: string;
  query: string;
  sort: NoteSort;
  layout: NotesLayout;
  onSort: (s: NoteSort) => void;
  onLayout: (l: NotesLayout) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onNavigate: (p: Page) => void;
}

export function NotesPage({ archived, labelId, labelName, query, sort, layout, onSort, onLayout, onOpen, onNew, onNavigate }: Props) {
  const actions = useNoteActions();
  const searching = query.trim().length > 0;
  const list = useNotes(archived, labelId, sort);
  const found = useSearch(query, archived);
  const notes = (searching ? found.data : list.data) ?? [];
  const mode = searching ? "search" : archived ? "archive" : labelId ? "label" : "notes";
  const title = searching ? `Results for “${query.trim()}”` : archived ? "Archive" : (labelName ?? "Notes");
  const description = searching ? `${notes.length} ${notes.length === 1 ? "match" : "matches"}${archived ? " in the Archive" : ""}` : undefined;

  return (
    <div className="space-y-6">
      {mode === "notes" && <TodayStrip onViewAll={() => onNavigate("today")} />}
      <div>
        <PageHeader
          title={title}
          {...(description ? { description } : {})}
          actions={
            <>
              {!searching && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"><ArrowDownUp />{SORTS[sort]}</Button>
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
            </>
          }
        />
        <NotesBoard
          notes={notes} layout={layout} mode={mode} onNew={onNew}
          onOpen={onOpen} onPin={(id, p) => void actions.pin(id, p)}
          onArchive={(id, a) => void actions.archive(id, a)} onDelete={(id) => void actions.remove(id)}
        />
      </div>
    </div>
  );
}
