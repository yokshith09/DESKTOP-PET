import { TrendingDown, TrendingUp } from "lucide-react";
import { Bars } from "@/features/charts/Bars";
import { Tile } from "@/features/shell/PageHeader";
import { useRecentLogs } from "@/hooks/useLoaf";
import { dayLabel, weekdayNarrow } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Tasks finished in the last 7 days against the 7 before. */
export function DoneThisWeek({ className }: { className?: string }) {
  const logs = useRecentLogs(14);
  const count = (xs: typeof logs) => xs.reduce((n, d) => n + (d.log?.snapshot.stats.completed_count ?? 0), 0);
  const week = logs.slice(7);
  const total = count(week);
  const delta = total - count(logs.slice(0, 7));
  const bars = week.map(({ date, log }, i) => ({
    key: String(i), value: log?.snapshot.stats.completed_count ?? 0, label: weekdayNarrow(date), active: i === 6,
    title: `${dayLabel(date)}: ${log?.snapshot.stats.completed_count ?? 0} done`,
  }));
  return (
    <Tile className={className} title="Done this week" bodyClassName="flex items-end gap-5 p-4">
      <div className="shrink-0">
        <p className="text-[34px] font-semibold leading-none tracking-tight tabular-nums">{total}</p>
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs", delta > 0 ? "text-success" : "text-muted-foreground")}>
          {delta === 0 ? "Same as last week" : <>{delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(delta)} {delta > 0 ? "more" : "fewer"} than last week</>}
        </p>
      </div>
      <Bars bars={bars} className="h-full min-h-0 flex-1" ariaLabel={`Tasks done per day: ${bars.map((b) => b.value).join(", ")}`} />
    </Tile>
  );
}
