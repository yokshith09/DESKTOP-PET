import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowDownUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBusSync, useLabels, useNoteActions, useNotes, useTodayTasks } from "@/hooks/useLoaf";
import { useTheme } from "@/hooks/useTheme";
import type { NoteSort } from "@/ipc";
import { NoteEditor } from "@/features/notes/NoteEditor";
import { NotesBoard } from "@/features/notes/NotesBoard";
import { TodayCard } from "@/features/tasks/TodayCard";
import { Hero } from "@/features/shell/Hero";
import { Sidebar, type View } from "@/features/shell/Sidebar";

const SORTS: Record<NoteSort, string> = { last_edited: "Last edited", created: "Date created", color: "Colour" };

function Screen() {
  const [view, setView] = useState<View>("notes");
  const [labelId, setLabelId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("last_edited");
  const [editing, setEditing] = useState<string | null>(null);

  useBusSync();
  const theme = useTheme();
  const actions = useNoteActions();
  const archived = view === "archive";
  const { data: notes = [] } = useNotes(archived, labelId, sort);
  const { data: allNotes = [] } = useNotes(false, null, "last_edited");
  const { data: labels = [] } = useLabels();
  const { data: tasks = [] } = useTodayTasks();

  const newNote = async () => {
    const note = await actions.create({ label_ids: labelId ? [labelId] : [] });
    setView("notes");
    setEditing(note.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void newNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const heading = archived ? "Archive" : labelId ? (labels.find((l) => l.label.id === labelId)?.label.name ?? "Notes") : "Notes";
  const showDashboard = !archived && labelId === null;

  return (
    <div className="flex h-screen min-h-[600px] bg-background text-foreground">
      <Sidebar
        view={view} labelId={labelId} labels={labels} noteCount={allNotes.length} isDark={theme.isDark}
        onView={setView} onLabel={setLabelId} onToggleTheme={() => void theme.toggle()}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-8 px-8 py-7">
          {showDashboard && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Hero noteCount={allNotes.length} openTasks={tasks.length} onNew={() => void newNote()} />
              <TodayCard />
            </div>
          )}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"><ArrowDownUp />{SORTS[sort]}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as NoteSort)}>
                      {(Object.keys(SORTS) as NoteSort[]).map((s) => (
                        <DropdownMenuRadioItem key={s} value={s}>{SORTS[s]}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {!showDashboard && !archived && <Button size="sm" onClick={() => void newNote()}><Plus />New note</Button>}
              </div>
            </div>
            <NotesBoard
              notes={notes} archived={archived} filtered={labelId !== null} onNew={() => void newNote()}
              onOpen={setEditing} onPin={(id, p) => void actions.pin(id, p)}
              onArchive={(id, a) => void actions.archive(id, a)} onDelete={(id) => void actions.remove(id)}
            />
          </div>
        </div>
      </main>
      <NoteEditor noteId={editing} onClose={() => setEditing(null)} />
      <Toaster />
    </div>
  );
}

export function App() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={300}>
        <Screen />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
