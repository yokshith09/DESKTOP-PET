import { ArrowRight, Bell, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY, useAgenda } from "@/features/overview/TodayAgenda";
import { useReminderActions, useTaskActions } from "@/hooks/useLoaf";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";

/** The first thing on the Notes page: what is due today, as slim checkable rows. */
export function TodayStrip({ onViewAll }: { onViewAll: () => void }) {
  const { tasks, reminders, open } = useAgenda();
  const { setDone } = useTaskActions();
  const reminderActions = useReminderActions();
  const rows = [
    ...reminders.map((r) => ({ kind: "reminder" as const, id: r.id, title: r.title, when: r.remind_at })),
    ...tasks.map(({ task, overdue }) => ({ kind: "task" as const, id: task.id, title: task.title, priority: task.priority, overdue, status: task.status })),
  ].slice(0, 5);

  const complete = async (id: string, title: string) => {
    await setDone(id, true);
    toast(`Completed “${title}”`, { action: { label: "Undo", onClick: () => void setDone(id, false) } });
  };

  return (
    <section aria-label="Today" className="rounded-xl border bg-card">
      <header className="flex h-11 items-center gap-2 border-b px-4">
        <CalendarCheck2 className="size-4 text-primary" />
        <h2 className="text-[13px] font-semibold">Today</h2>
        <span className="rounded-md bg-muted px-1.5 text-[11px] font-medium tabular-nums leading-5 text-muted-foreground">{open}</span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onViewAll}>Open Today<ArrowRight /></Button>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-[13px] text-muted-foreground">Nothing planned for today. Add a task from the Today page.</p>
      ) : (
        <ul className="grid gap-x-6 p-2 md:grid-cols-2">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="flex h-9 items-center gap-2.5 rounded-md px-2 hover:bg-accent/50">
              <Checkbox
                aria-label={`${r.kind === "task" ? "Complete" : "Done:"} ${r.title}`} checked={false}
                onCheckedChange={() => void (r.kind === "task" ? complete(r.id, r.title) : reminderActions.setDone(r.id, true))}
              />
              <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
              {r.kind === "reminder" ? (
                <span className={cn("flex items-center gap-1 text-[11px] tabular-nums", r.when < Date.now() ? "text-destructive" : "text-muted-foreground")}>
                  <Bell className="size-3" />{formatWhen(r.when)}
                </span>
              ) : (
                <>
                  {r.overdue && <Badge variant="destructive">Overdue</Badge>}
                  {r.status === "IN_PROGRESS" && <Badge variant="primary">In progress</Badge>}
                  {r.priority && <span className={cn("text-[11px]", PRIORITY[r.priority].cls)} aria-label={`${PRIORITY[r.priority].label} priority`}>{PRIORITY[r.priority].glyph}</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
