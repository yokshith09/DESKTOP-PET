import { ArrowRight, Bell, CalendarCheck2, NotebookPen, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tile } from "@/features/shell/PageHeader";
import type { Page } from "@/features/shell/Sidebar";
import { useBin } from "@/hooks/useLoaf";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { NoteSummary } from "@/ipc";
import { TodayAgenda, TodayComposer, useAgenda } from "./TodayAgenda";

function Stat({
  label, value, sub, icon, tone, onClick,
}: { label: string; value: number | string; sub: string; icon: React.ReactNode; tone?: "warn"; onClick?: () => void }) {
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
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs", tone === "warn" ? "text-destructive" : "text-muted-foreground")}>
          {tone === "warn" && <TriangleAlert className="size-3" />}{sub}
        </p>
      </div>
    </Comp>
  );
}

const DAY = 86_400_000;
const startOfDay = (ms: number) => new Date(new Date(ms).setHours(0, 0, 0, 0)).getTime();

/** Notes edited per day over the last seven days. */
function ActivityTile({ notes }: { notes: NoteSummary[] }) {
  const today = startOfDay(Date.now());
  const days = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY);
  const counts = days.map((d) => notes.filter((n) => n.edited_at >= d && n.edited_at < d + DAY).length);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <Tile title="Activity" action={<span className="text-[11px] text-muted-foreground">Last 7 days</span>} bodyClassName="flex flex-col p-4">
      <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{total}</p>
      <p className="mt-1 text-xs text-muted-foreground">{total === 1 ? "note edited" : "notes edited"}</p>
      <div className="mt-4 flex flex-1 items-end gap-2" role="img" aria-label={`Notes edited per day: ${counts.join(", ")}`}>
        {counts.map((c, i) => (
          <div key={days[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className={cn("w-full rounded-[3px]", i === 6 ? "bg-primary" : "bg-foreground/15")}
              style={{ height: `${Math.max(c === 0 ? 3 : 8, (c / max) * 100)}%`, maxHeight: "calc(100% - 20px)" }}
              title={`${new Date(days[i] ?? 0).toLocaleDateString([], { weekday: "long" })}: ${c}`}
            />
            <span className="text-[10px] text-muted-foreground">{new Date(days[i] ?? 0).toLocaleDateString([], { weekday: "narrow" })}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export function Overview({ notes, onNavigate }: { notes: NoteSummary[]; onNavigate: (p: Page) => void }) {
  const agenda = useAgenda();
  const { data: bin = [] } = useBin();
  const flagged = agenda.overdue + agenda.missed;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Notes" value={notes.length} sub={`${notes.filter((n) => n.pinned).length} pinned`} icon={<NotebookPen />} />
        <Stat
          label="Open today" value={agenda.open} icon={<CalendarCheck2 />} onClick={() => onNavigate("today")}
          sub={flagged ? `${flagged} overdue or missed` : "All on track"} {...(flagged ? { tone: "warn" as const } : {})}
        />
        <Stat
          label="Next up" icon={<Bell />} onClick={() => onNavigate("today")}
          value={agenda.next ? new Date(agenda.next.remind_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
          sub={agenda.next ? `${agenda.next.title} · ${formatWhen(agenda.next.remind_at).split(" ")[0] ?? ""}` : "No reminders scheduled"}
        />
        <Stat label="In Bin" value={bin.length} sub="Cleared after 30 days" icon={<Trash2 />} onClick={() => onNavigate("bin")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 lg:[&>*]:h-80">
        <Tile
          className="lg:col-span-8" title="Today" count={agenda.open}
          action={<Button variant="ghost" size="sm" onClick={() => onNavigate("today")}>View all<ArrowRight /></Button>}
          footer={<TodayComposer />}
        >
          <TodayAgenda />
        </Tile>
        <div className="lg:col-span-4 [&>section]:h-full"><ActivityTile notes={notes} /></div>
      </div>
    </div>
  );
}
