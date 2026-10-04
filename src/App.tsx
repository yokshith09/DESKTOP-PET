import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBin, useBusSync, useLabels, useNoteActions, useNotes } from "@/hooks/useLoaf";
import { useAgenda } from "@/features/overview/TodayAgenda";
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
import { TimePage } from "@/features/time/TimePage";
import { TodayOverviewPage } from "@/features/overview/TodayOverviewPage";

const PAGES: readonly Page[] = ["today", "time", "notes", "archive", "bin", "character", "mcp", "settings"];

function Screen() {
  const [page, setPageState] = useState<Page>("today");
  const [labelId, setLabelId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("last_edited");
  const [layout, setLayoutState] = useState<NotesLayout>("grid");
  const [editing, setEditing] = useState<string | null>(null);

  useBusSync();
  const theme = useTheme();
  const actions = useNoteActions();
  const { data: allNotes = [] } = useNotes(false, null, "last_edited");
  const { data: labels = [] } = useLabels();
  const agenda = useAgenda();
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

  const newNote = async () => {
    const note = await actions.create({ label_ids: labelId ? [labelId] : [] });
    if (page !== "notes") setPage("notes");
    setEditing(note.id);
  };
  const labelName = labelId ? labels.find((l) => l.label.id === labelId)?.label.name : undefined;

  return (
    <div className="flex h-screen min-h-[600px] bg-background text-foreground">
      <Sidebar
        page={page} labelId={labelId} labels={labels}
        counts={{ today: agenda.open, notes: allNotes.length, bin: bin.length }}
        onPage={setPage} onLabel={setLabelId} isDark={theme.isDark} onToggleTheme={() => void theme.toggle()}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-6 py-6">
            {(page === "notes" || page === "archive") && (
              <NotesPage
                archived={page === "archive"} labelId={page === "notes" ? labelId : null} {...(labelName ? { labelName } : {})}
                sort={sort} layout={layout} onSort={setSort} onLayout={setLayout}
                onOpen={setEditing} onNew={() => void newNote()} onNavigate={setPage}
              />
            )}
            {page === "today" && (
              <TodayOverviewPage
                onNavigate={setPage} onOpen={setEditing} onPin={(id, p) => void actions.pin(id, p)}
                onArchive={(id, a) => void actions.archive(id, a)} onDelete={(id) => void actions.remove(id)}
              />
            )}
            {page === "bin" && <BinPage />}
            {page === "character" && <CharacterPage />}
            {page === "settings" && <SettingsPage />}
            {page === "time" && <TimePage />}
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
