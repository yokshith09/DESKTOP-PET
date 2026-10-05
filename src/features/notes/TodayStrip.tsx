import { ArrowRight, Bell } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY, useAgenda } from "@/features/overview/TodayAgenda";
import { Tile } from "@/features/shell/PageHeader";
import { useReminderActions, useTaskActions } from "@/hooks/useLoaf";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Today's open tasks and due reminders as slim checkable rows: the first thing on the Notes tab. */
export function TodayStrip({ onViewAll, className }: { onViewAll: () => void; className?: string }) {
  const { tasks, reminders, open } = useAgenda();
  const { setDone } = useTaskActions();
  const reminderActions = useReminderActions();
  const rows = [
    ...reminders.map((r) => ({ kind: "reminder" as const, id: r.id, title: r.title, when: r.remind_at })),
    ...tasks.map(({ task, overdue }) => ({ kind: "task" as const, id: task.id, title: task.title, priority: task.priority, overdue, status: task.status })),
  ];

  const complete = async (id: string, title: string) => {
    await setDone(id, true);
    toast(`Completed “${title}”`, { action: { label: "Undo", onClick: () => void setDone(id, false) } });
  };

  return (
    <Tile
      className={className} title="Today" count={open}
      action={<Button variant="ghost" size="sm" onClick={onViewAll}>Open<ArrowRight /></Button>}
    >
      {rows.length === 0 ? (
        <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">Nothing planned for today.</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="flex h-9 items-center gap-2.5 rounded-md px-1.5 hover:bg-accent/50">
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
                  {r.status === "IN_PROGRESS" && <Badge variant="primary">Doing</Badge>}
                  {r.priority && <span className={cn("w-3 text-center text-[11px]", PRIORITY[r.priority].cls)} aria-label={`${PRIORITY[r.priority].label} priority`}>{PRIORITY[r.priority].glyph}</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}
