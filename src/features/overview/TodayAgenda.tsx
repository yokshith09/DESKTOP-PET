import { useState } from "react";
import { Bell, BellRing, CalendarCheck2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AddReminder } from "@/features/reminders/AddReminder";
import { useReminderActions, useReminders, useTaskActions, useTodayTasks } from "@/hooks/useLoaf";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Priority, Reminder } from "@/ipc";

export const PRIORITY: Record<Priority, { glyph: string; label: string; cls: string }> = {
  HIGH: { glyph: "▲", label: "High", cls: "text-primary" },
  MEDIUM: { glyph: "■", label: "Medium", cls: "text-muted-foreground" },
  LOW: { glyph: "▼", label: "Low", cls: "text-muted-foreground" },
};

const DAY = 86_400_000;
const endOfToday = () => new Date(new Date().setHours(23, 59, 59, 999)).getTime();

/** One "Today" agenda: reminders due by tonight (including missed ones) plus the day's tasks. */
export function useAgenda() {
  const { data: tasks = [] } = useTodayTasks();
  const { data: all = [] } = useReminders(false);
  const end = endOfToday();
  const reminders = all.filter((r) => r.remind_at <= end);
  const upcoming = all.filter((r) => r.remind_at > end && r.remind_at <= end + 7 * DAY);
  const missed = reminders.filter((r) => r.remind_at < Date.now()).length;
  const overdue = tasks.filter((t) => t.overdue).length;
  return { tasks, reminders, upcoming, open: tasks.length + reminders.length, missed, overdue, next: all.find((r) => r.remind_at >= Date.now()) };
}

function SectionLabel({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count: number }) {
  return (
    <h3 className="mb-1 mt-1 flex items-center gap-1.5 px-1.5 text-[11px] font-medium text-muted-foreground [&_svg]:size-3">
      {icon}{children}<span className="tabular-nums text-muted-foreground/70">{count}</span>
    </h3>
  );
}

function ReminderRow({ r }: { r: Reminder }) {
  const { setDone, remove } = useReminderActions();
  const now = Date.now();
  const missed = r.remind_at < now;
  return (
    <li className="group flex h-9 items-center gap-2.5 rounded-md px-1.5 hover:bg-accent/50">
      <Checkbox aria-label={`Mark “${r.title}” done`} checked={false} onCheckedChange={() => void setDone(r.id, true)} />
      <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
      <span className={cn("flex items-center gap-1 text-[11px] tabular-nums", missed ? "text-destructive" : "text-muted-foreground")}>
        {missed ? <BellRing className="size-3" /> : <Bell className="size-3" />}
        {missed ? "Missed · " : ""}{formatWhen(r.remind_at, now)}
      </span>
      <button
        type="button" aria-label={`Delete reminder “${r.title}”`} onClick={() => void remove(r.id)}
        className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

export function TodayAgenda({ showUpcoming = false }: { showUpcoming?: boolean }) {
  const { tasks, reminders, upcoming } = useAgenda();
  const { setDone } = useTaskActions();
  const complete = async (id: string, title: string) => {
    await setDone(id, true);
    toast(`Completed “${title}”`, { action: { label: "Undo", onClick: () => void setDone(id, false) } });
  };

  if (tasks.length === 0 && reminders.length === 0 && !(showUpcoming && upcoming.length)) {
    return (
      <div className="grid h-full place-items-center px-4 py-8 text-center">
        <div>
          <span className="mx-auto mb-2 grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><CalendarCheck2 className="size-4" /></span>
          <p className="text-[13px] font-medium">Nothing planned yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add the first thing you want to finish today.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reminders.length > 0 && (
        <section aria-label="Reminders">
          <SectionLabel icon={<Bell />} count={reminders.length}>Reminders</SectionLabel>
          <ul className="-mx-0.5">{reminders.map((r) => <ReminderRow key={r.id} r={r} />)}</ul>
        </section>
      )}
      {tasks.length > 0 && (
        <section aria-label="Tasks">
          <SectionLabel icon={<CalendarCheck2 />} count={tasks.length}>Tasks</SectionLabel>
          <ul className="-mx-0.5">
            {tasks.map(({ task, overdue }) => (
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
        </section>
      )}
      {showUpcoming && upcoming.length > 0 && (
        <section aria-label="Upcoming reminders">
          <SectionLabel icon={<Bell />} count={upcoming.length}>Upcoming this week</SectionLabel>
          <ul className="-mx-0.5">{upcoming.map((r) => <ReminderRow key={r.id} r={r} />)}</ul>
        </section>
      )}
    </div>
  );
}

/** Add a task (type and press Enter) or a reminder (bell). */
export function TodayComposer() {
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
      <AddReminder />
    </form>
  );
}
