import { Bell, CheckCircle2, FilePen, FilePlus2 } from "lucide-react";
import { LinksCard } from "@/features/links/Shortcuts";
import { TimeHero } from "@/features/time/TimeHero";
import { rangeBounds } from "@/features/time/range";
import { PageHeader, Tile } from "@/features/shell/PageHeader";
import { useDailyLog, useNotes, useReminders } from "@/hooks/useLoaf";
import { dayLabel, ymd } from "@/lib/dates";
import { clockTime, greeting } from "@/lib/time";
import { cn } from "@/lib/utils";
import { AgendaCard } from "./AgendaCard";
import { DoneThisWeek } from "./DoneThisWeek";
import { MovableTiles, type TileId } from "./MovableTiles";
import { useAgenda } from "./TodayAgenda";

interface FeedEvent { at: number; icon: React.ReactNode; text: string; tone?: "good" }

/** Today and the overview in one page: agenda, progress, time, activity. */
export function TodayOverviewPage() {
  const agenda = useAgenda();
  const now = new Date();
  const { data: log } = useDailyLog(ymd(now));
  const { data: notes = [] } = useNotes(false, null, "last_edited");
  const { data: reminders = [] } = useReminders(true);
  const today = rangeBounds("today");
  const flagged = agenda.overdue + agenda.missed;

  const events: FeedEvent[] = [
    ...(log?.snapshot.completed ?? []).filter((e) => e.completed_at).map((e) => ({ at: e.completed_at ?? 0, icon: <CheckCircle2 className="size-3.5" />, text: `Completed “${e.title}”`, tone: "good" as const })),
    ...notes.filter((n) => n.edited_at >= today.from).map((n) => (
      n.created_at >= today.from
        ? { at: n.created_at, icon: <FilePlus2 className="size-3.5" />, text: `Created “${n.title || "Untitled"}”` }
        : { at: n.edited_at, icon: <FilePen className="size-3.5" />, text: `Edited “${n.title || "Untitled"}”` }
    )),
    ...reminders.filter((r) => r.fired_at && r.fired_at >= today.from).map((r) => ({ at: r.fired_at ?? 0, icon: <Bell className="size-3.5" />, text: `Reminder: ${r.title}` })),
  ].sort((a, b) => b.at - a.at);

  const tiles: Record<TileId, { span: string; node: React.ReactNode; title: string }> = {
    agenda: { span: "lg:col-span-5", title: "Today", node: <AgendaCard className="h-full" /> },
    time: { span: "lg:col-span-7", title: "Total time today", node: <TimeHero className="h-full" /> },
    links: { span: "lg:col-span-4", title: "Links", node: <LinksCard className="h-full" /> },
    activity: {
      span: "lg:col-span-5", title: "Activity",
      node: (
        <Tile className="h-full" title="Activity" count={events.length}>
                  {events.length === 0 ? (
                    <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">Nothing yet today. Completed tasks, notes and reminders show up here.</p>
                  ) : (
                    <ol className="relative ml-2 space-y-4 border-l pl-5">
                      {events.map((e, i) => (
                        <li key={i} className="relative">
                          <span className={cn("absolute -left-[31px] top-0 grid size-[22px] place-items-center rounded-full border bg-card text-muted-foreground", e.tone === "good" && "text-success")}>{e.icon}</span>
                          <p className="text-[13px] leading-snug">{e.text}</p>
                          <p className="text-[11px] tabular-nums text-muted-foreground">{clockTime(e.at)}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </Tile>
      ),
    },
    done: { span: "lg:col-span-3", title: "Done this week", node: <DoneThisWeek className="h-full" /> },
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={greeting(now.getHours())}
        description={`${dayLabel(now)} · ${agenda.open} open${flagged ? ` · ${flagged} overdue or missed` : ""}`}
        actions={<span className="text-xs text-muted-foreground">Local data · saved</span>}
      />
      <MovableTiles tiles={tiles} />
    </div>
  );
}
