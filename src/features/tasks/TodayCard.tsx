import { useState } from "react";
import { CalendarCheck2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Priority } from "@/ipc";
import { useTaskActions, useTodayTasks } from "@/hooks/useLoaf";

const PRIORITY: Record<Priority, { glyph: string; label: string; cls: string }> = {
  HIGH: { glyph: "▲", label: "High", cls: "text-primary" },
  MEDIUM: { glyph: "■", label: "Medium", cls: "text-muted-foreground" },
  LOW: { glyph: "▼", label: "Low", cls: "text-muted-foreground" },
};

export function TodayCard({ className }: { className?: string }) {
  const { data: rows = [] } = useTodayTasks();
  const { quickAdd, setDone } = useTaskActions();
  const [draft, setDraft] = useState("");

  const complete = async (id: string, title: string) => {
    await setDone(id, true);
    toast(`Completed “${title}”`, { action: { label: "Undo", onClick: () => void setDone(id, false) } });
  };
  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    await quickAdd(title);
  };

  return (
    <section aria-labelledby="today-h" className={cn("flex flex-col rounded-2xl border bg-card p-5", className)}>
      <header className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"><CalendarCheck2 className="size-4" /></span>
        <h2 id="today-h" className="text-base font-semibold tracking-tight">Today</h2>
        <Badge className="ml-auto">{rows.length} open</Badge>
      </header>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-muted-foreground">
          Nothing planned yet. Add the first thing you want to finish today.
        </p>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {rows.slice(0, 5).map(({ task, overdue }) => (
            <li key={task.id} className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-foreground/5">
              <Checkbox aria-label={`Complete ${task.title}`} checked={false} onCheckedChange={() => void complete(task.id, task.title)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{task.title}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {task.priority && (
                    <span className={PRIORITY[task.priority].cls}>
                      <span aria-hidden>{PRIORITY[task.priority].glyph}</span> {PRIORITY[task.priority].label}
                    </span>
                  )}
                  {task.status === "IN_PROGRESS" && <Badge variant="primary">In progress</Badge>}
                  {overdue && <Badge variant="destructive">Overdue</Badge>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-auto flex gap-2 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task for today…" aria-label="New task" maxLength={200} />
        <Button type="submit" size="icon" variant="secondary" aria-label="Add task" disabled={!draft.trim()}><Plus /></Button>
      </form>
    </section>
  );
}
