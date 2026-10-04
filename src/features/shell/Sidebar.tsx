import {
  Archive, CalendarCheck2, Clock3, LayoutDashboard, NotebookPen, PawPrint, Plug, Settings, Tag, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabelCount } from "@/ipc";
import { Bear } from "./Bear";

export type Page = "overview" | "today" | "time" | "notes" | "archive" | "bin" | "character" | "mcp" | "settings";

interface Props {
  page: Page;
  labelId: string | null;
  labels: LabelCount[];
  counts: { today: number; notes: number; bin: number };
  onPage: (p: Page) => void;
  onLabel: (id: string | null) => void;
}

function Item({
  active, onClick, icon, children, count,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {active && <span aria-hidden className="absolute -left-2 top-1.5 h-5 w-[3px] rounded-r bg-primary" />}
      {icon}
      <span className="truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-0.5">
      {title && <p className="mb-1 mt-4 px-2.5 text-[11px] font-medium text-muted-foreground/80">{title}</p>}
      {children}
    </nav>
  );
}

export function Sidebar({ page, labelId, labels, counts, onPage, onLabel }: Props) {
  const go = (p: Page) => () => {
    onLabel(null);
    onPage(p);
  };
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-[var(--sidebar)] px-3 pb-3 pt-3.5">
      <div className="mb-3 flex items-center gap-2.5 px-1.5">
        <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-primary/12 ring-1 ring-primary/25">
          <Bear className="mt-1 size-7" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Loaf</span>
        <span className="ml-auto rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">Local</span>
      </div>

      <Group>
        <Item active={page === "overview"} onClick={go("overview")} icon={<LayoutDashboard />}>Overview</Item>
        <Item active={page === "today"} onClick={go("today")} icon={<CalendarCheck2 />} count={counts.today}>Today</Item>
        <Item active={page === "time"} onClick={go("time")} icon={<Clock3 />}>Time</Item>
        <Item active={page === "notes" && labelId === null} onClick={go("notes")} icon={<NotebookPen />} count={counts.notes}>Notes</Item>
        <Item active={page === "character"} onClick={go("character")} icon={<PawPrint />}>Character</Item>
        <Item active={page === "mcp"} onClick={go("mcp")} icon={<Plug />}>MCP</Item>
      </Group>

      <Group title="Library">
        <Item active={page === "archive"} onClick={go("archive")} icon={<Archive />}>Archive</Item>
        <Item active={page === "bin"} onClick={go("bin")} icon={<Trash2 />} count={counts.bin}>Bin</Item>
      </Group>

      {labels.length > 0 && (
        <Group title="Labels">
          {labels.map(({ label, count }) => (
            <Item
              key={label.id}
              active={page === "notes" && labelId === label.id}
              onClick={() => {
                onPage("notes");
                onLabel(label.id);
              }}
              icon={<Tag />}
              count={count}
            >
              {label.name}
            </Item>
          ))}
        </Group>
      )}

      <div className="mt-auto space-y-0.5 border-t pt-3">
        <Item active={page === "settings"} onClick={go("settings")} icon={<Settings />}>Settings</Item>
        <p className="px-2.5 pt-2 text-[11px] leading-4 text-muted-foreground/80">Everything stays on this computer.</p>
      </div>
    </aside>
  );
}
