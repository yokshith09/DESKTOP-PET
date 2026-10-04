import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Clock3, Plug } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBin, useBusSync, useLabels, useNoteActions, useNotes, useTodayTasks } from "@/hooks/useLoaf";
import { useTheme } from "@/hooks/useTheme";
import { ipc, type NoteSort } from "@/ipc";
import { BinPage } from "@/features/bin/BinPage";
import { CharacterPage } from "@/features/character/CharacterPage";
import { NoteEditor } from "@/features/notes/NoteEditor";
import { NotesPage } from "@/features/notes/NotesPage";
import type { NotesLayout } from "@/features/notes/NotesBoard";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ComingSoon } from "@/features/shell/ComingSoon";
import { Sidebar, type Page } from "@/features/shell/Sidebar";
import { TopBar } from "@/features/shell/TopBar";
import { TodayPage } from "@/features/tasks/TodayPage";

const PAGES: readonly Page[] = ["today", "time", "notes", "archive", "bin", "character", "mcp", "settings"];

function Screen() {
  const [page, setPageState] = useState<Page>("notes");
  const [labelId, setLabelId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("last_edited");
  const [layout, setLayoutState] = useState<NotesLayout>("grid");
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useBusSync();
  const theme = useTheme();
  const actions = useNoteActions();
  const { data: allNotes = [] } = useNotes(false, null, "last_edited");
  const { data: labels = [] } = useLabels();
  const { data: tasks = [] } = useTodayTasks();
  const { data: bin = [] } = useBin();

  // Restore where the person left off (ui.last_view, ui.notes_layout).
  useEffect(() => {
    void ipc.prefsGet<Page>("ui.last_view").then((p) => p && PAGES.includes(p) && setPageState(p));
    void ipc.prefsGet<NotesLayout>("ui.notes_layout").then((l) => (l === "grid" || l === "list") && setLayoutState(l));
  }, []);
  const setPage = (p: Page) => {
    setPageState(p);
    void ipc.prefsSet("ui.last_view", p);
  };
  const setLayout = (l: NotesLayout) => {
    setLayoutState(l);
    void ipc.prefsSet("ui.notes_layout", l);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const newNote = async () => {
    const note = await actions.create({ label_ids: labelId ? [labelId] : [] });
    if (page !== "notes") setPage("notes");
    setEditing(note.id);
  };
  const onQuery = (q: string) => {
    setQuery(q);
    if (q.trim() && page !== "notes" && page !== "archive") setPage("notes");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "n") {
        e.preventDefault();
        void newNote();
      } else if (k === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const labelName = labelId ? labels.find((l) => l.label.id === labelId)?.label.name : undefined;

  return (
    <div className="flex h-screen min-h-[600px] bg-background text-foreground">
      <Sidebar
        page={page} labelId={labelId} labels={labels}
        counts={{ today: tasks.length, notes: allNotes.length, bin: bin.length }}
        onPage={setPage} onLabel={setLabelId}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar ref={searchRef} query={query} onQuery={onQuery} isDark={theme.isDark} onToggleTheme={() => void theme.toggle()} onNewNote={() => void newNote()} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-6 py-6">
            {(page === "notes" || page === "archive") && (
              <NotesPage
                archived={page === "archive"} labelId={page === "notes" ? labelId : null} {...(labelName ? { labelName } : {})}
                query={debounced} sort={sort} layout={layout} onSort={setSort} onLayout={setLayout}
                onOpen={setEditing} onNew={() => void newNote()} onNavigate={setPage}
              />
            )}
            {page === "today" && <TodayPage />}
            {page === "bin" && <BinPage />}
            {page === "character" && <CharacterPage />}
            {page === "settings" && <SettingsPage />}
            {page === "time" && <ComingSoon icon={<Clock3 />} title="Time" description="Daily logs and time tracking will live here. Tell us what you want to see first." />}
            {page === "mcp" && <ComingSoon icon={<Plug />} title="MCP" description="Connect external tools and services to Loaf through the Model Context Protocol. This arrives in a later release." />}
          </div>
        </main>
      </div>
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
