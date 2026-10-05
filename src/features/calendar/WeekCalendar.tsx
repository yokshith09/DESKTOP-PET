import { useMemo } from "react";
import { Bell, CalendarDays } from "lucide-react";
import { Tile } from "@/features/shell/PageHeader";
import { useAllTasks, useReminders } from "@/hooks/useLoaf";
import { parseYmd, ymd } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Kind = "task" | "reminder" | "deadline";
interface Item { id: string; title: string; kind: Kind; at: number; done: boolean }

const DOT: Record<Kind, string> = { task: "bg-foreground/40", reminder: "bg-primary", deadline: "bg-destructive" };
const MAX_PER_DAY = 3;
const EDGE: Record<Kind, string> = { task: "border-foreground/30", reminder: "border-primary", deadline: "border-destructive" };

/** Monday of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** This week, Monday to Sunday: tasks by planned date, deadlines by due date, reminders by time. */
export function WeekCalendar({ className }: { className?: string }) {
  const { data: tasks = [] } = useAllTasks();
  const { data: reminders = [] } = useReminders(false);
  const todayKey = ymd(new Date());
  const monday = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));

  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    const add = (key: string, item: Item) => map.set(key, [...(map.get(key) ?? []), item]);
    for (const { task } of tasks) {
      if (task.status === "CANCELLED") continue;
      const done = task.status === "COMPLETED";
      if (task.due_date) add(task.due_date, { id: `${task.id}-due`, title: task.title, kind: "deadline", at: parseYmd(task.due_date).getTime(), done });
      else if (task.planned_date) add(task.planned_date, { id: task.id, title: task.title, kind: "task", at: parseYmd(task.planned_date).getTime(), done });
    }
    for (const r of reminders) add(ymd(new Date(r.remind_at)), { id: r.id, title: r.title, kind: "reminder", at: r.remind_at, done: false });
    for (const list of map.values()) list.sort((a, b) => a.at - b.at);
    return map;
  }, [tasks, reminders]);

  const last = days[6] ?? monday;
  const range = `${monday.toLocaleDateString([], { month: "short", day: "numeric" })} – ${last.toLocaleDateString([], { month: "short", day: "numeric" })}`;

  return (
    <Tile
      className={className} title="This week" count={[...byDay.entries()].filter(([k]) => days.some((d) => ymd(d) === k)).reduce((n, [, v]) => n + v.length, 0)}
      action={<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="size-3.5" />{range}</span>}
      bodyClassName="p-0" footer={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground" aria-label="Legend">
          {([["task", "Task"], ["deadline", "Deadline"], ["reminder", "Reminder"]] as const).map(([k, l]) => (
            <li key={k} className="flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", DOT[k])} />{l}</li>
          ))}
        </ul>
      }
    >
      <div className="grid h-full grid-cols-7 divide-x" role="grid" aria-label="This week">
        {days.map((d) => {
          const key = ymd(d);
          const items = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div key={key} role="gridcell" aria-label={d.toDateString()} className={cn("relative flex min-w-0 flex-col p-2", isToday && "bg-primary/[0.06]")}>
              {isToday && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
              <div className="mb-2 flex items-baseline justify-between px-0.5">
                <span className={cn("text-[11px]", isToday ? "font-semibold text-primary" : "text-muted-foreground")}>{d.toLocaleDateString([], { weekday: "short" })}</span>
                <span className={cn("text-sm font-semibold tabular-nums", isToday ? "text-primary" : "text-foreground")}>{d.getDate()}</span>
              </div>
              <ul className="space-y-1">
                {items.slice(0, MAX_PER_DAY).map((it) => (
                  <li key={it.id} title={it.title} className={cn("flex items-start gap-1 rounded-[5px] border-l-2 bg-muted/60 px-1.5 py-1 text-[11px] leading-[14px]", EDGE[it.kind], it.done && "opacity-50 line-through")}>
                    {it.kind === "reminder" && <Bell className="mt-px size-2.5 shrink-0 text-primary" />}
                    <span className="line-clamp-2 min-w-0">{it.title}</span>
                  </li>
                ))}
                {items.length > MAX_PER_DAY && <li className="px-1 text-[11px] text-muted-foreground">+{items.length - MAX_PER_DAY} more</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}
