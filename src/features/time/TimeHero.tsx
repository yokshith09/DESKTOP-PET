import { useState } from "react";
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
import { SessionsDialog, type Detail } from "./SessionsDialog";

/** Today's total screen time, large, with the day's shape and where it went by category. */
export function TimeHero({ className }: { className?: string }) {
  const { data: status } = useTrackingStatus();
  const today = rangeBounds("today");
  const yesterday = rangeBounds("yesterday");
  const { data: usage } = useUsage(today.from, today.to);
  const { data: before } = useUsage(yesterday.from, yesterday.to);
  const [, setEnabled] = useSetting("tracking.apps");
  const tracking = status?.enabled ?? false;
  const [detail, setDetail] = useState<Detail | null>(null);

  const total = usage?.total_seconds ?? 0;
  const delta = total - (before?.total_seconds ?? 0);
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
          <div className="mt-5 grid min-h-0 flex-1 gap-5 sm:grid-cols-2">
            <UsageList label="Apps" empty="No apps yet." items={(usage?.apps ?? []).map((a) => ({ key: a.app, name: a.app, category: a.category, seconds: a.total_seconds, kind: "app" as const }))} onOpen={setDetail} />
            <UsageList label="Websites" empty="No sites yet. They appear once the Loaf browser extension is connected." items={(usage?.domains ?? []).map((d) => ({ key: d.domain, name: d.domain, category: d.category, seconds: d.total_seconds, kind: "domain" as const }))} onOpen={setDetail} />
          </div>
          <div className="mt-4 shrink-0 border-t pt-3">
            <Bars bars={hours} className="h-14 gap-1" ariaLabel="Time by hour of the day" />
          </div>
          <SessionsDialog detail={detail} from={today.from} to={today.to} onClose={() => setDetail(null)} />
        </>
      )}
    </Tile>
  );
}

interface Item { key: string; name: string; category: string; seconds: number; kind: "app" | "domain" }

/** Every app or site with its time, longest first; click for the active spans. */
function UsageList({ label, items, empty, onOpen }: { label: string; items: Item[]; empty: string; onOpen: (d: Detail) => void }) {
  const max = items[0]?.seconds ?? 1;
  return (
    <section aria-label={label} className="flex min-h-0 flex-col">
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">{label}<span className="tabular-nums text-muted-foreground/70">{items.length}</span></h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto">
          {items.map((it) => (
            <li key={it.key}>
              <button type="button" onClick={() => onOpen({ kind: it.kind, name: it.name, category: it.category })}
                aria-label={`${it.name}, ${formatDuration(it.seconds)}. Show when you were active`}
                className="block w-full rounded-md px-1 py-1.5 text-left outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13px]">{it.name}</span>
                  <span className="ml-auto text-[12px] font-medium tabular-nums">{formatDuration(it.seconds)}</span>
                </span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                  <span className={cn("block h-full rounded-full", categoryStyle(it.category).bar)} style={{ width: `${Math.max(2, (it.seconds / Math.max(1, max)) * 100)}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
