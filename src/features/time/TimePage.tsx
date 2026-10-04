import { useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Bars, type Bar } from "@/features/charts/Bars";
import { Ring } from "@/features/charts/Ring";
import { PageHeader, Tile } from "@/features/shell/PageHeader";
import { useRecentLogs } from "@/hooks/useLoaf";
import { dayLabel, weekdayShort, ymd } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DailyLog, LogEntry } from "@/ipc";

const DAYS = 14;
const PRIORITY_GLYPH = { HIGH: "▲", MEDIUM: "■", LOW: "▼" } as const;

function statusRows(log: DailyLog | null) {
  const s = log?.snapshot;
  return [
    { label: "Completed", n: s?.completed.length ?? 0, cls: "bg-success" },
    { label: "In progress", n: s?.in_progress.length ?? 0, cls: "bg-primary" },
    { label: "Planned", n: s?.planned.length ?? 0, cls: "bg-foreground/30" },
    { label: "Pending", n: s?.pending.length ?? 0, cls: "bg-violet" },
    { label: "Cancelled", n: s?.cancelled.length ?? 0, cls: "bg-foreground/15" },
    { label: "Overdue", n: s?.overdue.length ?? 0, cls: "bg-destructive" },
  ];
}

/** Daily logs, laid out like a phone's Digital Wellbeing: pick a day, see how it went. */
export function TimePage() {
  const days = useRecentLogs(DAYS);
  const [selected, setSelected] = useState(String(DAYS - 1));
  const idx = Number(selected);
  const current = days[idx];
  const log = current?.log ?? null;
  const stats = log?.snapshot.stats;
  const week = days.slice(-7);
  const perDay = (l: DailyLog | null) => l?.snapshot.stats.completed_count ?? 0;
  const avg = week.reduce((a, d) => a + perDay(d.log), 0) / 7;

  const bars: Bar[] = week.map((d, i) => ({
    key: String(DAYS - 7 + i), value: perDay(d.log), label: weekdayShort(d.date).slice(0, 3),
    title: `${dayLabel(d.date)}: ${perDay(d.log)} completed`,
  }));
  const hours = Array.from({ length: 24 }, (_, h) => (log?.snapshot.completed ?? []).filter((e) => e.completed_at && new Date(e.completed_at).getHours() === h).length);
  const maxHour = Math.max(1, ...hours);
  const entries: LogEntry[] = log ? [...log.snapshot.completed, ...log.snapshot.in_progress, ...log.snapshot.planned, ...log.snapshot.pending, ...log.snapshot.cancelled] : [];
  const rows = statusRows(log);
  const total = Math.max(1, rows.reduce((a, r) => a + r.n, 0));

  return (
    <div className="space-y-4">
      <PageHeader title="Time" description="Your daily logs. Pick a day to see how it went." />

      <div role="tablist" aria-label="Days" className="flex gap-1.5 overflow-x-auto pb-1"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSelected(String(Math.max(0, idx - 1)));
          if (e.key === "ArrowRight") setSelected(String(Math.min(DAYS - 1, idx + 1)));
        }}>
        {days.map(({ date, log: l }, i) => {
          const r = l?.snapshot.stats.completion_ratio ?? 0;
          const on = String(i) === selected;
          return (
            <button key={ymd(date)} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => setSelected(String(i))}
              className={cn("flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", on ? "border-primary/60 bg-primary/10" : "bg-card hover:border-foreground/25")}>
              <span className="text-[11px] text-muted-foreground">{i === DAYS - 1 ? "Today" : weekdayShort(date)}</span>
              <span className="text-sm font-semibold tabular-nums">{date.getDate()}</span>
              <span className="h-1 w-8 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${r * 100}%` }} /></span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-72">
        <Tile className="lg:col-span-4" title={current ? dayLabel(current.date) : "Day"}
          action={log?.reconstructed ? <Badge variant="violet">Reconstructed</Badge> : log?.live ? <Badge variant="primary">Live</Badge> : undefined}
          bodyClassName="flex items-center gap-5 p-4">
          <Ring value={stats?.completion_ratio ?? null} size={120}>
            <div>
              <p className="text-2xl font-semibold leading-none tabular-nums">{stats?.completion_ratio != null ? Math.round(stats.completion_ratio * 100) : "—"}{stats?.completion_ratio != null && <span className="text-sm">%</span>}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">completed</p>
            </div>
          </Ring>
          <div className="min-w-0 space-y-1 text-[13px]">
            <p><span className="font-semibold tabular-nums">{stats?.completed_count ?? 0}</span> of <span className="tabular-nums">{stats?.planned_count ?? 0}</span> tasks</p>
            <p className="text-muted-foreground"><span className="tabular-nums">{stats?.notes_created ?? 0}</span> notes written</p>
            <p className="text-muted-foreground"><span className="tabular-nums">{stats?.notes_edited ?? 0}</span> notes edited</p>
            <p className="text-muted-foreground"><span className="tabular-nums">{stats?.meetings ?? 0}</span> meetings</p>
          </div>
        </Tile>
        <Tile className="lg:col-span-8" title="Tasks completed" action={<span className="text-[11px] text-muted-foreground">Dashed line: {avg.toFixed(1)} per day</span>} bodyClassName="flex p-4">
          <Bars bars={bars} average={avg} selectedKey={selected} onSelect={setSelected} className="flex-1" ariaLabel={`Tasks completed per day: ${bars.map((b) => b.value).join(", ")}`} />
        </Tile>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Tile className="lg:col-span-7 lg:h-96" title="When you got things done" bodyClassName="p-4">
          <div className="grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }} role="img" aria-label="Tasks completed by hour of day">
            {hours.map((n, h) => (
              <div key={h} title={`${h}:00 · ${n} completed`} className="h-10 rounded-[3px] bg-primary" style={{ opacity: n === 0 ? 0.08 : 0.25 + (n / maxHour) * 0.75 }} />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>
          <ul className="mt-5 space-y-2.5">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3 text-[13px]">
                <span className="w-24 text-muted-foreground">{r.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", r.cls)} style={{ width: `${(r.n / total) * 100}%` }} /></span>
                <span className="w-6 text-right tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </Tile>
        <Tile className="lg:col-span-5 lg:h-96" title="Log" count={entries.length}>
          {entries.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">No tasks were planned on this day.</p>
          ) : (
            <ul className="-mx-1">
              {entries.map((e) => (
                <li key={e.id} className="flex h-9 items-center gap-2.5 rounded-md px-2 hover:bg-accent/50">
                  <span className={cn("size-2 shrink-0 rounded-full", e.status_at_eod === "COMPLETED" ? "bg-success" : "bg-foreground/25")} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{e.title}</span>
                  {e.priority && <span className="text-[11px] text-muted-foreground" aria-label={`${e.priority} priority`}>{PRIORITY_GLYPH[e.priority]}</span>}
                  <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
                    {e.completed_at ? new Date(e.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="size-3.5" />App and browser time will appear here in a later release.</p>
    </div>
  );
}
