import { useState } from "react";
import { ArrowRight, CalendarCheck2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/features/shell/PageHeader";
import { AddReminder } from "@/features/reminders/AddReminder";
import { RemindersList } from "@/features/reminders/RemindersList";
import { BinList, EmptyBinButton } from "@/features/bin/BinList";
import { useBin, useReminders, useTaskActions, useTodayTasks } from "@/hooks/useLoaf";
import { cn } from "@/lib/utils";
import type { Priority } from "@/ipc";

export const PRIORITY: Record<Priority, { glyph: string; label: string; cls: string }> = {
  HIGH: { glyph: "▲", label: "High", cls: "text-primary" },
  MEDIUM: { glyph: "■", label: "Medium", cls: "text-muted-foreground" },
  LOW: { glyph: "▼", label: "Low", cls: "text-muted-foreground" },
};

export function TaskRows({ limit }: { limit?: number }) {
  const { data = [] } = useTodayTasks();
  const { setDone } = useTaskActions();
  const rows = limit ? data.slice(0, limit) : data;
  const complete = async (id: string, title: string) => {
    await setDone(id, true);
    toast(`Completed “${title}”`, { action: { label: "Undo", onClick: () => void setDone(id, false) } });
  };
  if (rows.length === 0) {
    return <p className="px-1 py-8 text-center text-[13px] text-muted-foreground">Nothing planned yet. Add the first thing you want to finish today.</p>;
  }
  return (
    <ul className="-mx-1.5">
      {rows.map(({ task, overdue }) => (
        <li key={task.id} className="flex h-9 items-center gap-2.5 rounded-md px-1.5 hover:bg-accent/50">
          <Checkbox aria-label={`Complete ${task.title}`} checked={false} onCheckedChange={() => void complete(task.id, task.title)} />
          <span className="min-w-0 flex-1 truncate text-[13px]">{task.title}</span>
          {task.status === "IN_PROGRESS" && <Badge variant="primary">In progress</Badge>}
          {overdue && <Badge variant="destructive">Overdue</Badge>}
          {task.priority && (
            <span className={cn("w-14 text-right text-[11px]", PRIORITY[task.priority].cls)} title={`${PRIORITY[task.priority].label} priority`}>
              <span aria-hidden>{PRIORITY[task.priority].glyph}</span> {PRIORITY[task.priority].label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function QuickAddTask() {
  const { quickAdd } = useTaskActions();
  const [draft, setDraft] = useState("");
  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    await quickAdd(title);
  };
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task for today" aria-label="New task" maxLength={200} />
      <Button type="submit" variant="secondary" size="icon" aria-label="Add task" disabled={!draft.trim()}><Plus /></Button>
    </form>
  );
}

export function Overview({ onOpenToday }: { onOpenToday: () => void }) {
  const { data: tasks = [] } = useTodayTasks();
  const { data: reminders = [] } = useReminders(false);
  const { data: bin = [] } = useBin();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="flex min-h-64 flex-col p-4">
        <header className="mb-2 flex items-center gap-2">
          <CalendarCheck2 className="size-4 text-primary" />
          <h2 id="today-h" className="text-[13px] font-semibold">Today</h2>
          <Badge>{tasks.length} open</Badge>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onOpenToday}>View all<ArrowRight /></Button>
        </header>
        <div className="flex-1"><TaskRows limit={4} /></div>
        <QuickAddTask />
      </Panel>

      <Panel className="flex min-h-64 flex-col p-4">
        <Tabs defaultValue="reminders" className="flex flex-1 flex-col">
          <header className="mb-2 flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="reminders">Reminders{reminders.length > 0 && <span className="tabular-nums text-muted-foreground">{reminders.length}</span>}</TabsTrigger>
              <TabsTrigger value="bin">Bin{bin.length > 0 && <span className="tabular-nums text-muted-foreground">{bin.length}</span>}</TabsTrigger>
            </TabsList>
            <TabsContent value="reminders" className="ml-auto"><AddReminder /></TabsContent>
            <TabsContent value="bin" className="ml-auto"><EmptyBinButton /></TabsContent>
          </header>
          <TabsContent value="reminders" className="flex-1"><RemindersList limit={5} /></TabsContent>
          <TabsContent value="bin" className="flex-1"><BinList limit={5} /></TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}
