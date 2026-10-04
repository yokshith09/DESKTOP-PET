import { ArrowRight, Bell, CalendarCheck2, CheckCheck, NotebookPen, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bars, type Bar } from "@/features/charts/Bars";
import { PinnedRow } from "@/features/notes/NotesBoard";
import { NoteCard, type NoteHandlers } from "@/features/notes/NoteCard";
import { PageHeader, Tile } from "@/features/shell/PageHeader";
import type { Page } from "@/features/shell/Sidebar";
import { useNotes, useRecentLogs } from "@/hooks/useLoaf";
import { dayLabel, weekdayNarrow } from "@/lib/dates";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import { TodayAgenda, TodayComposer, useAgenda } from "./TodayAgenda";

export function Stat({
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

/** Tasks completed + notes written or edited, per day. */
export function activityOf(log: { snapshot: { stats: { completed_count: number; notes_created: number; notes_edited: number } } } | null): number {
  const s = log?.snapshot.stats;
  return s ? s.completed_count + s.notes_created + s.notes_edited : 0;
}

export function ActivityTile() {
  const days = useRecentLogs(7);
  const bars: Bar[] = days.map(({ date, log }, i) => ({
    key: String(i), value: activityOf(log), label: weekdayNarrow(date), active: i === 6,
    title: `${dayLabel(date)}: ${activityOf(log)} actions`,
  }));
  const total = bars.reduce((a, b) => a + b.value, 0);
  return (
    <Tile title="Activity" action={<span className="text-[11px] text-muted-foreground">Last 7 days</span>} bodyClassName="flex flex-col p-4">
      <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{total}</p>
      <p className="mt-1 text-xs text-muted-foreground">tasks done and notes written</p>
      <Bars bars={bars} className="mt-4 flex-1" ariaLabel={`Activity per day: ${bars.map((b) => b.value).join(", ")}`} />
    </Tile>
  );
}

export function OverviewPage({ onNavigate, ...h }: { onNavigate: (p: Page) => void } & NoteHandlers) {
  const agenda = useAgenda();
  const { data: notes = [] } = useNotes(false, null, "last_edited");
  const logs = useRecentLogs(14);
  const done = (xs: typeof logs) => xs.reduce((a, d) => a + (d.log?.snapshot.stats.completed_count ?? 0), 0);
  const thisWeek = done(logs.slice(7));
  const lastWeek = done(logs.slice(0, 7));
  const delta = thisWeek - lastWeek;
  const flagged = agenda.overdue + agenda.missed;
  const pinned = notes.filter((n) => n.pinned);
  const recent = notes.filter((n) => !n.pinned).slice(0, 4);
  const date = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-4">
      <PageHeader title="Overview" description={date} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Open today" value={agenda.open} icon={<CalendarCheck2 />} onClick={() => onNavigate("today")}
          sub={flagged ? <><TriangleAlert className="size-3" />{flagged} overdue or missed</> : "All on track"} {...(flagged ? { tone: "warn" as const } : {})} />
        <Stat label="Done this week" value={thisWeek} icon={<CheckCheck />} onClick={() => onNavigate("time")}
          sub={delta === 0 ? "Same as last week" : <>{delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(delta)} {delta > 0 ? "more" : "fewer"} than last week</>}
          {...(delta > 0 ? { tone: "good" as const } : {})} />
        <Stat label="Next up" icon={<Bell />} onClick={() => onNavigate("today")}
          value={agenda.next ? new Date(agenda.next.remind_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
          sub={agenda.next ? `${agenda.next.title} · ${formatWhen(agenda.next.remind_at).split(" ")[0] ?? ""}` : "No reminders scheduled"} />
        <Stat label="Notes" value={notes.length} icon={<NotebookPen />} onClick={() => onNavigate("notes")} sub={`${pinned.length} pinned`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-80">
        <Tile className="lg:col-span-8" title="Today" count={agenda.open}
          action={<Button variant="ghost" size="sm" onClick={() => onNavigate("today")}>View all<ArrowRight /></Button>} footer={<TodayComposer />}>
          <TodayAgenda />
        </Tile>
        <div className="lg:col-span-4 [&>section]:h-full"><ActivityTile /></div>
      </div>

      {pinned.length > 0 && <PinnedRow notes={pinned} {...h} />}
      {recent.length > 0 && (
        <section aria-label="Recent notes">
          <div className="mb-2.5 flex items-center">
            <h2 className="text-xs font-medium text-muted-foreground">Recent notes</h2>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onNavigate("notes")}>All notes<ArrowRight /></Button>
          </div>
          <div className="gap-3 [columns:16rem]">{recent.map((n) => <NoteCard key={n.id} note={n} {...h} />)}</div>
        </section>
      )}
    </div>
  );
}
