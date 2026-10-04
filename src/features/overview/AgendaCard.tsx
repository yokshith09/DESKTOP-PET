import { Bell, CalendarDays, CheckSquare, ListChecks } from "lucide-react";
import { useDailyLog } from "@/hooks/useLoaf";
import { ymd } from "@/lib/dates";
import { cn } from "@/lib/utils";
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

/** The main agenda: tasks and reminders for today, with a quick add. */
export function AgendaCard({ className }: { className?: string }) {
  const agenda = useAgenda();
  const { data: log } = useDailyLog(ymd(new Date()));
  const done = log?.snapshot.stats.completed_count ?? 0;
  const week = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <section aria-label="Today’s agenda" className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card", className)}>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
        <CalendarDays className="size-4 text-primary" />
        <h2 className="text-[13px] font-semibold">Today</h2>
        <span className="text-xs text-muted-foreground">{week}</span>
      </header>
      <div className="grid shrink-0 grid-cols-3 divide-x border-b">
        <Mini icon={<ListChecks />} label="Done today" value={done} sub="tasks completed" />
        <Mini icon={<CheckSquare />} label="Tasks" value={agenda.tasks.length} sub={agenda.overdue ? `${agenda.overdue} overdue` : "open today"} />
        <Mini icon={<Bell />} label="Reminders" value={agenda.reminders.length} sub={agenda.missed ? `${agenda.missed} missed` : "due today"} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3"><TodayAgenda /></div>
      <footer className="shrink-0 border-t p-3"><TodayComposer /></footer>
    </section>
  );
}
