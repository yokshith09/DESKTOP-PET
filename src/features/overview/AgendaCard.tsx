import { Bell, CalendarClock, CalendarDays, CheckSquare, Timer } from "lucide-react";
import { Shortcuts } from "@/features/links/Shortcuts";
import { useUsage, useTrackingStatus, useUpcomingTasks } from "@/hooks/useLoaf";
import { formatDuration, formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import { rangeBounds } from "@/features/time/range";
import { TodayAgenda, TodayComposer, useAgenda } from "./TodayAgenda";

function Mini({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold leading-tight tabular-nums">{value}</p>
        {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

const dayWord = (ms: number) => {
  const d = new Date(ms);
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) / 86_400_000);
  return diff === 1 ? "Tomorrow" : d.toLocaleDateString([], { weekday: "short", day: "numeric" });
};

/** Coming up: planned tasks and reminders after today. Calendar events join them once a calendar is connected. */
function ComingUp() {
  const { upcoming } = useAgenda();
  const { data: tasks = [] } = useUpcomingTasks();
  const items = [
    ...tasks.map(({ task }) => ({ id: task.id, kind: "task" as const, title: task.title, at: new Date(`${task.planned_date}T00:00:00`).getTime() })),
    ...upcoming.map((r) => ({ id: r.id, kind: "reminder" as const, title: r.title, at: r.remind_at })),
  ].sort((a, b) => a.at - b.at).slice(0, 7);
  return (
    <div className="flex min-h-0 flex-col">
      <h3 className="mb-1 mt-1 flex items-center gap-1.5 px-1.5 text-[11px] font-medium text-muted-foreground"><CalendarClock className="size-3" />Coming up<span className="tabular-nums text-muted-foreground/70">{items.length}</span></h3>
      {items.length === 0 ? (
        <p className="px-1.5 py-4 text-[13px] text-muted-foreground">Nothing planned for the next few days.</p>
      ) : (
        <ul>
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="flex h-9 items-center gap-2.5 rounded-md px-1.5 hover:bg-accent/50">
              <span className={cn("grid size-5 shrink-0 place-items-center rounded text-muted-foreground [&_svg]:size-3", it.kind === "reminder" ? "text-primary" : "")}>
                {it.kind === "reminder" ? <Bell /> : <CheckSquare />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{it.title}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{it.kind === "reminder" ? formatWhen(it.at).replace(/^Tomorrow /, "Tom. ") : dayWord(it.at)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto px-1.5 pt-3 text-[11px] leading-snug text-muted-foreground">Calendar events will appear here once a calendar is connected.</p>
    </div>
  );
}

/** The main agenda: today's time, tasks, reminders, what's coming up and your shortcuts, in one card. */
export function AgendaCard({ className }: { className?: string }) {
  const agenda = useAgenda();
  const { data: status } = useTrackingStatus();
  const today = rangeBounds("today");
  const { data: usage } = useUsage(today.from, today.to);
  const topApp = usage?.apps[0];
  const week = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <section aria-label="Today’s agenda" className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card", className)}>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
        <CalendarDays className="size-4 text-primary" />
        <h2 className="text-[13px] font-semibold">Today</h2>
        <span className="text-xs text-muted-foreground">{week}</span>
      </header>
      <div className="grid shrink-0 grid-cols-3 divide-x border-b">
        <Mini icon={<Timer />} label="Time today" value={status?.enabled ? formatDuration(usage?.total_seconds ?? 0) : "Off"}
          {...(status?.enabled ? (topApp ? { sub: `Most in ${topApp.app}` } : { sub: "Nothing yet" }) : { sub: "Tracking is off" })} />
        <Mini icon={<CheckSquare />} label="Tasks" value={agenda.tasks.length} sub={agenda.overdue ? `${agenda.overdue} overdue` : "open today"} />
        <Mini icon={<Bell />} label="Reminders" value={agenda.reminders.length} sub={agenda.missed ? `${agenda.missed} missed` : "due today"} />
      </div>
      <div className="shrink-0 border-b px-4 py-2.5"><Shortcuts /></div>
      <div className="grid min-h-0 flex-1 gap-x-6 overflow-y-auto p-3 lg:grid-cols-2">
        <div className="min-w-0"><TodayAgenda /></div>
        <div className="min-w-0 lg:border-l lg:pl-6"><ComingUp /></div>
      </div>
      <footer className="shrink-0 border-t p-3"><TodayComposer /></footer>
    </section>
  );
}
