import { Globe, LayoutGrid, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Bars } from "@/features/charts/Bars";
import { Switch } from "@/components/ui/switch";
import { Tile } from "@/features/shell/PageHeader";
import { useTrackingStatus, useUsage } from "@/hooks/useLoaf";
import { useSetting } from "@/hooks/useTheme";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { categoryStyle } from "./categories";
import { rangeBounds } from "./range";

/** Today's total screen time, large, with the day's shape and where it went by category. */
export function TimeHero({ className }: { className?: string }) {
  const { data: status } = useTrackingStatus();
  const today = rangeBounds("today");
  const yesterday = rangeBounds("yesterday");
  const { data: usage } = useUsage(today.from, today.to);
  const { data: before } = useUsage(yesterday.from, yesterday.to);
  const [, setEnabled] = useSetting("tracking.apps");
  const tracking = status?.enabled ?? false;

  const total = usage?.total_seconds ?? 0;
  const delta = total - (before?.total_seconds ?? 0);
  const byCategory = new Map<string, number>();
  for (const a of usage?.apps ?? []) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + a.total_seconds);
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const all = categories.reduce((n, [, v]) => n + v, 0) || 1;
  const hours = (usage?.hourly_seconds ?? Array<number>(24).fill(0)).map((v, h) => ({
    key: String(h), value: v, label: h % 6 === 0 ? String(h) : "", title: `${String(h).padStart(2, "0")}:00 · ${formatDuration(v)}`,
    active: new Date().getHours() === h,
  }));

  return (
    <Tile className={className} title="Total time today" bodyClassName="flex flex-col p-5">
      {status && !status.supported ? (
        <p className="m-auto text-center text-[13px] text-muted-foreground">App time tracking isn’t available on this system yet.</p>
      ) : !tracking ? (
        <div className="m-auto flex max-w-xs flex-col items-center text-center">
          <span className="mb-3 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground"><ShieldCheck className="size-5" /></span>
          <p className="text-sm font-medium">See where your day goes</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Stays on this computer. No window titles, no full web addresses. Delete it any time.</p>
          <label className="mt-4 flex items-center gap-2.5 text-[13px] font-medium">
            <Switch checked={false} onCheckedChange={(v) => void setEnabled(v)} aria-label="Track app usage" />
            Turn on app tracking
          </label>
        </div>
      ) : (
        <>
          <p className="text-6xl font-semibold leading-none tracking-tight tabular-nums" aria-label={`Total time today ${formatDuration(total)}`}>{formatDuration(total)}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><LayoutGrid className="size-3.5" />{usage?.apps.length ?? 0} apps</span>
            <span className="inline-flex items-center gap-1"><Globe className="size-3.5" />{usage?.domains.length ?? 0} sites</span>
            {before && before.total_seconds > 0 && delta !== 0 && (
              <span className={cn("inline-flex items-center gap-1", delta > 0 ? "text-primary" : "text-success")}>
                {delta > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {formatDuration(Math.abs(delta))} {delta > 0 ? "more" : "less"} than yesterday
              </span>
            )}
          </p>
          {categories.length > 0 && (
            <>
              <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Share of time by category">
                {categories.map(([c, v]) => <span key={c} className={cn("h-full", categoryStyle(c).bar)} style={{ width: `${(v / all) * 100}%` }} />)}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                {categories.slice(0, 4).map(([c, v]) => (
                  <li key={c} className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", categoryStyle(c).dot)} />
                    <span className="text-muted-foreground">{c}</span>
                    <span className="font-medium tabular-nums">{formatDuration(v)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-auto pt-5">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">By hour</p>
            <Bars bars={hours} className="h-24 gap-1" ariaLabel="Time by hour of the day" />
          </div>
        </>
      )}
    </Tile>
  );
}
