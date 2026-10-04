import { CalendarCheck2 } from "lucide-react";
import { Panel, PageHeader } from "@/features/shell/PageHeader";
import { QuickAddTask, TaskRows } from "@/features/overview/Overview";
import { useTodayTasks } from "@/hooks/useLoaf";
import { Empty } from "@/features/notes/NotesBoard";

export function TodayPage() {
  const { data = [] } = useTodayTasks();
  const overdue = data.filter((r) => r.overdue).length;
  const date = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Today" description={`${date} · ${data.length} open${overdue ? ` · ${overdue} overdue` : ""}`} />
      <Panel className="p-4">
        {data.length === 0 ? (
          <Empty icon={<CalendarCheck2 />} title="Nothing planned yet" hint="Add the first thing you want to finish today." />
        ) : (
          <TaskRows />
        )}
        <div className="mt-3"><QuickAddTask /></div>
      </Panel>
    </div>
  );
}
