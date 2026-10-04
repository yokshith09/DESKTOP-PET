import { Bell, BellRing, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatWhen } from "@/lib/time";
import { useReminderActions, useReminders } from "@/hooks/useLoaf";

export function RemindersList({ limit }: { limit?: number }) {
  const { data = [] } = useReminders(false);
  const { setDone, remove } = useReminderActions();
  const rows = limit ? data.slice(0, limit) : data;
  if (rows.length === 0) {
    return <p className="px-1 py-8 text-center text-[13px] text-muted-foreground">No reminders. Add one and Loaf will notify you when it’s due.</p>;
  }
  const now = Date.now();
  return (
    <ul className="-mx-1.5">
      {rows.map((r) => {
        const missed = r.remind_at < now;
        return (
          <li key={r.id} className="group flex h-9 items-center gap-2.5 rounded-md px-1.5 hover:bg-accent/50">
            <Checkbox aria-label={`Mark “${r.title}” done`} checked={false} onCheckedChange={() => void setDone(r.id, true)} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
            <span className={cn("flex items-center gap-1 text-[11px] tabular-nums", missed ? "text-destructive" : "text-muted-foreground")}>
              {missed ? <BellRing className="size-3" /> : <Bell className="size-3" />}
              {missed ? "Missed · " : ""}{formatWhen(r.remind_at, now)}
            </span>
            <button type="button" aria-label={`Delete reminder “${r.title}”`} onClick={() => void remove(r.id)}
              className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
