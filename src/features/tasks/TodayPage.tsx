import { Tile, PageHeader } from "@/features/shell/PageHeader";
import { TodayAgenda, TodayComposer, useAgenda } from "@/features/overview/TodayAgenda";

export function TodayPage() {
  const a = useAgenda();
  const date = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const flagged = a.overdue + a.missed;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Today" description={`${date} · ${a.open} open${flagged ? ` · ${flagged} overdue or missed` : ""}`} />
      <Tile title="Agenda" count={a.open} footer={<TodayComposer />} bodyClassName="min-h-64">
        <TodayAgenda showUpcoming />
      </Tile>
    </div>
  );
}
