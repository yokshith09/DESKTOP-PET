import { ArrowRight, Bell, CalendarCheck2, CheckCheck, CheckCircle2, FilePen, FilePlus2, NotebookPen, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bars, type Bar } from "@/features/charts/Bars";
import { Ring } from "@/features/charts/Ring";
import { PinnedCard, type NoteHandlers } from "@/features/notes/NoteCard";
import { PageHeader, Tile } from "@/features/shell/PageHeader";
import type { Page } from "@/features/shell/Sidebar";
import { useDailyLog, useNotes, useRecentLogs, useReminders } from "@/hooks/useLoaf";
import { dayLabel, weekdayNarrow, ymd } from "@/lib/dates";
import { formatWhen, greeting } from "@/lib/time";
import { cn } from "@/lib/utils";
import { TodayAgenda, TodayComposer, useAgenda } from "./TodayAgenda";

function Stat({
  label, value, sub, icon, tone, onClick,
}: { label: string; value: number | string; sub: React.ReactNode; icon: React.ReactNode; tone?: "warn" | "good"; onClick?: () => void }) {
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
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs", tone === "warn" ? "text-destructive" : tone === "good" ? "text-success" : "text-muted-foreground")}>{sub}</p>
      </div>
    </Comp>
  );
}

const activityOf = (log: { snapshot: { stats: { completed_count: number; notes_created: number; notes_edited: number } } } | null) => {
  const s = log?.snapshot.stats;
  return s ? s.completed_count + s.notes_created + s.notes_edited : 0;
};
const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

interface FeedEvent { at: number; icon: React.ReactNode; text: string; tone?: "good" }

/** Today and the overview in one place: what's due, how today is going, what happened, the week. */
export function TodayOverviewPage({ onNavigate, ...h }: { onNavigate: (p: Page) => void } & NoteHandlers) {
  const agenda = useAgenda();
  const today = new Date();
  const { data: log } = useDailyLog(ymd(today));
  const { data: notes = [] } = useNotes(false, null, "last_edited");
  const { data: reminders = [] } = useReminders(true);
  const logs = useRecentLogs(14);

  const stats = log?.snapshot.stats;
  const planned = stats?.planned_count ?? 0;
  const completed = stats?.completed_count ?? 0;
  const flagged = agenda.overdue + agenda.missed;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const sum = (xs: typeof logs) => xs.reduce((a, d) => a + (d.log?.snapshot.stats.completed_count ?? 0), 0);
  const thisWeek = sum(logs.slice(7));
  const delta = thisWeek - sum(logs.slice(0, 7));
  const pinned = notes.filter((n) => n.pinned);

  const events: FeedEvent[] = [
    ...(log?.snapshot.completed ?? []).filter((e) => e.completed_at).map((e) => ({ at: e.completed_at ?? 0, icon: <CheckCircle2 className="size-3.5" />, text: `Completed “${e.title}”`, tone: "good" as const })),
    ...notes.filter((n) => n.edited_at >= start).map((n) => (
      n.created_at >= start
        ? { at: n.created_at, icon: <FilePlus2 className="size-3.5" />, text: `Created “${n.title || "Untitled"}”` }
        : { at: n.edited_at, icon: <FilePen className="size-3.5" />, text: `Edited “${n.title || "Untitled"}”` }
    )),
    ...reminders.filter((r) => r.fired_at && r.fired_at >= start).map((r) => ({ at: r.fired_at ?? 0, icon: <Bell className="size-3.5" />, text: `Reminder: ${r.title}` })),
  ].sort((a, b) => b.at - a.at);
  const hourCounts = Array.from({ length: 24 }, (_, hr) => events.filter((e) => new Date(e.at).getHours() === hr).length);
  const maxHour = Math.max(1, ...hourCounts);

  const week = logs.slice(7);
  const bars: Bar[] = week.map(({ date, log: l }, i) => ({
    key: String(i), value: activityOf(l), label: weekdayNarrow(date), active: i === 6, title: `${dayLabel(date)}: ${activityOf(l)} actions`,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title={greeting(today.getHours())}
        description={`${dayLabel(today)} · ${agenda.open} open${flagged ? ` · ${flagged} overdue or missed` : ""}`}
        actions={<span className="text-xs text-muted-foreground">Local data · saved</span>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Open today" value={agenda.open} icon={<CalendarCheck2 />}
          sub={flagged ? <><TriangleAlert className="size-3" />{flagged} overdue or missed</> : "All on track"} {...(flagged ? { tone: "warn" as const } : {})} />
        <Stat label="Done this week" value={thisWeek} icon={<CheckCheck />} onClick={() => onNavigate("time")}
          sub={delta === 0 ? "Same as last week" : <>{delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(delta)} {delta > 0 ? "more" : "fewer"} than last week</>}
          {...(delta > 0 ? { tone: "good" as const } : {})} />
        <Stat label="Next up" icon={<Bell />}
          value={agenda.next ? fmtTime(agenda.next.remind_at) : "—"}
          sub={agenda.next ? `${agenda.next.title} · ${formatWhen(agenda.next.remind_at).split(" ")[0] ?? ""}` : "No reminders scheduled"} />
        <Stat label="Notes" value={notes.length} icon={<NotebookPen />} onClick={() => onNavigate("notes")} sub={`${pinned.length} pinned`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-[26rem]">
        <Tile className="lg:col-span-5" title="Today’s agenda" count={agenda.open} footer={<TodayComposer />}>
          <TodayAgenda showUpcoming />
        </Tile>
        <Tile className="lg:col-span-3" title="Progress" bodyClassName="flex flex-col items-center justify-center gap-4 p-4">
          <Ring value={stats?.completion_ratio ?? (planned ? completed / planned : 0)} size={112}>
            <div>
              <p className="text-[28px] font-semibold leading-none tabular-nums">{planned ? Math.round((completed / planned) * 100) : 0}%</p>
              <p className="mt-1 text-[11px] text-muted-foreground">of planned</p>
            </div>
          </Ring>
          <div className="w-full">
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }} role="img" aria-label="Activity by hour today">
              {hourCounts.map((n, hr) => (
                <div key={hr} title={`${hr}:00 · ${n} ${n === 1 ? "action" : "actions"}`} className="h-5 rounded-[2px] bg-primary" style={{ opacity: n === 0 ? 0.1 : 0.3 + (n / maxHour) * 0.7 }} />
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
        <Tile className="lg:col-span-4" title="Activity" count={events.length}>
          {events.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">Nothing yet today. Completed tasks, notes and reminders show up here.</p>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[31px] top-0 grid size-[22px] place-items-center rounded-full border bg-card text-muted-foreground", e.tone === "good" && "text-success")}>{e.icon}</span>
                  <p className="text-[13px] leading-snug">{e.text}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">{fmtTime(e.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </Tile>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Tile
          className="lg:col-span-8 lg:h-72" title="Pinned notes" count={pinned.length}
          action={<Button variant="ghost" size="sm" onClick={() => onNavigate("notes")}>All notes<ArrowRight /></Button>}
        >
          {pinned.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">Pin a note and it stays here.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{pinned.map((n) => <PinnedCard key={n.id} note={n} {...h} />)}</div>
          )}
        </Tile>
        <Tile className="lg:col-span-4 lg:h-72" title="This week" action={<span className="text-[11px] text-muted-foreground">Actions per day</span>} bodyClassName="flex flex-col p-4">
          <Bars bars={bars} className="flex-1" ariaLabel={`Activity per day: ${bars.map((b) => b.value).join(", ")}`} />
          <Button variant="ghost" size="sm" className="mt-3 self-end" onClick={() => onNavigate("time")}>Daily logs<ArrowRight /></Button>
        </Tile>
      </div>
    </div>
  );
}
