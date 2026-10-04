import { Bell, FilePen, FilePlus2, CheckCircle2 } from "lucide-react";
import { Ring } from "@/features/charts/Ring";
import { TodayAgenda, TodayComposer, useAgenda } from "@/features/overview/TodayAgenda";
import { PageHeader, Tile } from "@/features/shell/PageHeader";
import { useDailyLog, useNotes, useReminders } from "@/hooks/useLoaf";
import { dayLabel, ymd } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface Event { at: number; icon: React.ReactNode; text: string; tone?: "good" }

/** Today's tasks, reminders and what happened so far, in one place. */
export function TodayPage() {
  const agenda = useAgenda();
  const today = new Date();
  const { data: log } = useDailyLog(ymd(today));
  const { data: notes = [] } = useNotes(false, null, "last_edited");
  const { data: reminders = [] } = useReminders(true);
  const stats = log?.snapshot.stats;
  const planned = stats?.planned_count ?? 0;
  const completed = stats?.completed_count ?? 0;
  const flagged = agenda.overdue + agenda.missed;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const events: Event[] = [
    ...(log?.snapshot.completed ?? []).filter((e) => e.completed_at).map((e) => ({ at: e.completed_at ?? 0, icon: <CheckCircle2 className="size-3.5" />, text: `Completed “${e.title}”`, tone: "good" as const })),
    ...notes.filter((n) => n.edited_at >= start).map((n) => (
      n.created_at >= start
        ? { at: n.created_at, icon: <FilePlus2 className="size-3.5" />, text: `Created “${n.title || "Untitled"}”` }
        : { at: n.edited_at, icon: <FilePen className="size-3.5" />, text: `Edited “${n.title || "Untitled"}”` }
    )),
    ...reminders.filter((r) => r.fired_at && r.fired_at >= start).map((r) => ({ at: r.fired_at ?? 0, icon: <Bell className="size-3.5" />, text: `Reminder: ${r.title}` })),
  ].sort((a, b) => b.at - a.at);

  const hourCounts = Array.from({ length: 24 }, (_, h) => events.filter((e) => new Date(e.at).getHours() === h).length);
  const maxHour = Math.max(1, ...hourCounts);
  const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <PageHeader title="Today" description={`${dayLabel(today)} · ${agenda.open} open${flagged ? ` · ${flagged} overdue or missed` : ""}`} />
      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-[26rem]">
        <Tile className="lg:col-span-3" title="Today’s progress" bodyClassName="flex flex-col items-center justify-center gap-4 p-4">
          <Ring value={stats?.completion_ratio ?? (planned ? completed / planned : 0)} size={112}>
            <div>
              <p className="text-[28px] font-semibold leading-none tabular-nums">{planned ? Math.round((completed / planned) * 100) : 0}%</p>
              <p className="mt-1 text-[11px] text-muted-foreground">of planned</p>
            </div>
          </Ring>
          <div className="w-full">
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }} role="img" aria-label="Activity by hour today">
              {hourCounts.map((n, h) => (
                <div key={h} title={`${h}:00 · ${n} ${n === 1 ? "action" : "actions"}`} className="h-5 rounded-[2px] bg-primary" style={{ opacity: n === 0 ? 0.1 : 0.3 + (n / maxHour) * 0.7 }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>12 AM</span><span>12 PM</span><span>11 PM</span></div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {events.length ? `Active ${fmtTime(Math.min(...events.map((e) => e.at)))} – ${fmtTime(Math.max(...events.map((e) => e.at)))}` : "No activity yet today"}
            </p>
          </div>
          <dl className="grid w-full grid-cols-3 gap-2 text-center">
            {[["Planned", planned], ["Done", completed], ["Left", Math.max(0, planned - completed)]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/60 py-2">
                <dd className="text-base font-semibold tabular-nums">{v}</dd>
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
              </div>
            ))}
          </dl>
        </Tile>
        <Tile className="lg:col-span-5" title="Agenda" count={agenda.open} footer={<TodayComposer />}>
          <TodayAgenda showUpcoming />
        </Tile>
        <Tile className="lg:col-span-4" title="Activity" count={events.length}>
          {events.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">Nothing yet today. Completed tasks, notes and reminders show up here.</p>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[31px] top-0 grid size-[22px] place-items-center rounded-full border bg-card text-muted-foreground", e.tone === "good" && "text-success")}>{e.icon}</span>
                  <p className="text-[13px] leading-snug">{e.text}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                </li>
              ))}
            </ol>
          )}
        </Tile>
      </div>
    </div>
  );
}
