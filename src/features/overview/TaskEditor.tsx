import { useState, type ReactNode } from "react";
import { Bell, CalendarClock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useReminderActions, useTaskActions } from "@/hooks/useLoaf";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import type { Priority, Task } from "@/ipc";

const NONE = "none";
const PRIORITIES = [{ value: NONE, label: "None" }, { value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }];

const atHour = (daysAhead: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};

function Field({ icon, label, htmlFor, children }: { icon: ReactNode; label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5">{icon}{label}</label>
      {children}
    </div>
  );
}

/** Opens from a task's title: rename it, set a priority and a deadline, and add a reminder for it. */
export function TaskEditor({ task, children }: { task: Task; children: ReactNode }) {
  const { update } = useTaskActions();
  const { create } = useReminderActions();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<string>(task.priority ?? NONE);
  const [due, setDue] = useState(task.due_date ?? "");
  const [remind, setRemind] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(task.title); setPriority(task.priority ?? NONE); setDue(task.due_date ?? ""); setRemind("");
  };
  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await update(task.id, {
        title: title.trim(),
        priority: priority === NONE ? null : (priority as Priority),
        planned_date: task.planned_date,
        due_date: due || null,
      });
      if (remind) await create(title.trim(), fromLocalInput(remind));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };
  const presets = [
    { label: "In 1 hour", at: () => Date.now() + 3_600_000 },
    { label: "This evening", at: () => atHour(Date.now() > atHour(0, 18) ? 1 : 0, 18) },
    { label: "Tomorrow 9 AM", at: () => atHour(1, 9) },
  ];

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <form className="space-y-3.5" aria-label={`Edit ${task.title}`} onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <Input value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} aria-label="Task title" className="font-medium" />
          <Field icon={<Flag />} label="Priority">
            <ToggleGroup type="single" value={priority} onValueChange={(v) => v && setPriority(v)} aria-label="Priority" className="w-full">
              {PRIORITIES.map((p) => (
                <ToggleGroupItem key={p.value} value={p.value} className="flex-1 px-2">{p.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field icon={<CalendarClock />} label="Deadline" htmlFor="task-due">
            <div className="flex gap-2">
              <Input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              {due && <Button type="button" variant="ghost" size="sm" onClick={() => setDue("")}>Clear</Button>}
            </div>
          </Field>
          <Field icon={<Bell />} label="Remind me" htmlFor="task-remind">
            <Input id="task-remind" type="datetime-local" value={remind} onChange={(e) => setRemind(e.target.value)} />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {presets.map((p) => (
                <button key={p.label} type="button" onClick={() => setRemind(toLocalInput(p.at()))}
                  className="rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                  {p.label}
                </button>
              ))}
              {remind && <button type="button" onClick={() => setRemind("")} className="px-1 text-[11px] text-muted-foreground underline-offset-2 hover:underline">No reminder</button>}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!title.trim() || saving}>Save</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
