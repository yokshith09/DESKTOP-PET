import { useState } from "react";
import { ArrowRight, Bell, CalendarCheck2, NotebookPen, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tile } from "@/features/shell/PageHeader";
import { AddReminder } from "@/features/reminders/AddReminder";
import { RemindersList } from "@/features/reminders/RemindersList";
import { BinList, EmptyBinButton } from "@/features/bin/BinList";
import { useBin, useReminders, useTaskActions, useTodayTasks } from "@/hooks/useLoaf";
import { cn } from "@/lib/utils";
import type { NoteSummary, Priority } from "@/ipc";
import type { Page } from "@/features/shell/Sidebar";
import { formatWhen } from "@/lib/time";

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

function Stat({
  label, value, sub, icon, tone, onClick,
}: { label: string; value: number | string; sub: string; icon: React.ReactNode; tone?: "warn"; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">{icon}</span>
      </div>
      <div>
        <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs", tone === "warn" ? "text-destructive" : "text-muted-foreground")}>
          {tone === "warn" && <TriangleAlert className="size-3" />}{sub}
        </p>
      </div>
    </Comp>
  );
}

const DAY = 86_400_000;
const startOfDay = (ms: number) => new Date(new Date(ms).setHours(0, 0, 0, 0)).getTime();

/** Notes edited per day over the last seven days. */
function ActivityTile({ notes }: { notes: NoteSummary[] }) {
  const today = startOfDay(Date.now());
  const days = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY);
  const counts = days.map((d) => notes.filter((n) => n.edited_at >= d && n.edited_at < d + DAY).length);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <Tile title="Activity" action={<span className="text-[11px] text-muted-foreground">Last 7 days</span>} bodyClassName="flex flex-col p-4">
      <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{total}</p>
      <p className="mt-1 text-xs text-muted-foreground">{total === 1 ? "note edited" : "notes edited"}</p>
      <div className="mt-4 flex flex-1 items-end gap-2" role="img" aria-label={`Notes edited per day: ${counts.join(", ")}`}>
        {counts.map((c, i) => (
          <div key={days[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={cn("w-full rounded-[3px]", i === 6 ? "bg-primary" : "bg-foreground/15")}
              style={{ height: `${Math.max(c === 0 ? 3 : 8, (c / max) * 100)}%`, maxHeight: "calc(100% - 20px)" }}
              title={`${new Date(days[i] ?? 0).toLocaleDateString([], { weekday: "long" })}: ${c}`}
            />
            <span className="text-[10px] text-muted-foreground">{new Date(days[i] ?? 0).toLocaleDateString([], { weekday: "narrow" })}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export function Overview({ notes, onNavigate }: { notes: NoteSummary[]; onNavigate: (p: Page) => void }) {
  const { data: tasks = [] } = useTodayTasks();
  const { data: reminders = [] } = useReminders(false);
  const { data: bin = [] } = useBin();
  const overdue = tasks.filter((t) => t.overdue).length;
  const next = reminders[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Notes" value={notes.length} sub={`${notes.filter((n) => n.pinned).length} pinned`} icon={<NotebookPen />} />
        <Stat
          label="Open today" value={tasks.length} icon={<CalendarCheck2 />} onClick={() => onNavigate("today")}
          sub={overdue ? `${overdue} overdue` : "All on track"} {...(overdue ? { tone: "warn" as const } : {})}
        />
        <Stat label="Reminders" value={reminders.length} icon={<Bell />} sub={next ? `Next: ${formatWhen(next.remind_at)}` : "Nothing scheduled"} />
        <Stat label="In Bin" value={bin.length} icon={<Trash2 />} sub="Cleared after 30 days" onClick={() => onNavigate("bin")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-80">
        <Tile
          className="lg:col-span-5" title="Today" count={tasks.length}
          action={<Button variant="ghost" size="sm" onClick={() => onNavigate("today")}>View all<ArrowRight /></Button>}
          footer={<QuickAddTask />}
        >
          <TaskRows limit={6} />
        </Tile>

        <Tabs defaultValue="reminders" className="contents">
          <Tile
            className="lg:col-span-4"
            tabs={
              <TabsList>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="bin">Bin</TabsTrigger>
              </TabsList>
            }
            action={
              <>
                <TabsContent value="reminders"><AddReminder /></TabsContent>
                <TabsContent value="bin"><EmptyBinButton /></TabsContent>
              </>
            }
          >
            <TabsContent value="reminders"><RemindersList limit={8} /></TabsContent>
            <TabsContent value="bin"><BinList limit={8} /></TabsContent>
          </Tile>
        </Tabs>

        <div className="lg:col-span-3 [&>section]:h-full"><ActivityTile notes={notes} /></div>
      </div>
    </div>
  );
}
