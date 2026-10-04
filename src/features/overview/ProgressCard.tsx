import { Tile } from "@/features/shell/PageHeader";
import { cn } from "@/lib/utils";
import type { DailyLog } from "@/ipc";

/** Where you are against today's plan, with a pace check against the working day (9 to 6). */
export function ProgressCard({ log, className }: { log: DailyLog | null | undefined; className?: string }) {
  const s = log?.snapshot;
  const planned = s?.stats.planned_count ?? 0;
  const done = s?.completed.length ?? 0;
  const doing = s?.in_progress.length ?? 0;
  const left = Math.max(0, planned - done - doing);
  const pct = planned ? Math.round((done / planned) * 100) : 0;
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  const expected = Math.min(1, Math.max(0, (hour - 9) / 9));
  const status = planned === 0 ? "No plan yet" : done === planned ? "All done" : pct / 100 >= expected * 0.8 ? "On track" : "Behind pace";
  const tone = status === "Behind pace" ? "text-destructive" : status === "No plan yet" ? "text-muted-foreground" : "text-success";
  const seg = (n: number) => (planned ? `${(n / planned) * 100}%` : "0%");

  return (
    <Tile className={className} title="Progress" action={<span className={cn("text-xs font-medium", tone)}>{status}</span>} bodyClassName="flex flex-col justify-center gap-5 p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">{pct}<span className="text-2xl text-muted-foreground">%</span></p>
          <p className="mt-1.5 text-xs text-muted-foreground">{done} of {planned} tasks finished</p>
        </div>
        <p className="pb-1 text-right text-[11px] leading-snug text-muted-foreground">Expected by now<br /><span className="text-sm font-medium tabular-nums text-foreground">{Math.round(expected * 100)}%</span></p>
      </div>
      <div>
        <div className="relative flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${done} done, ${doing} in progress, ${left} left`}>
          <span className="h-full bg-success" style={{ width: seg(done) }} />
          <span className="h-full bg-primary" style={{ width: seg(doing) }} />
          <span aria-hidden className="absolute inset-y-0 w-px bg-foreground/60" style={{ left: `${expected * 100}%` }} title="Where you would be at an even pace" />
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {[["Done", done, "bg-success"], ["In progress", doing, "bg-primary"], ["Left", left, "bg-muted-foreground/40"]].map(([k, v, c]) => (
            <div key={String(k)} className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", String(c))} />
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="ml-auto font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Tile>
  );
}
