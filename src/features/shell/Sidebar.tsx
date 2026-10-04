import { Archive, Moon, NotebookPen, Sun, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LabelCount } from "@/ipc";
import { Bear } from "./Bear";

export type View = "notes" | "archive";

interface Props {
  view: View;
  labelId: string | null;
  labels: LabelCount[];
  noteCount: number;
  isDark: boolean;
  onView: (v: View) => void;
  onLabel: (id: string | null) => void;
  onToggleTheme: () => void;
}

function Item({ active, onClick, icon, children, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
        active ? "bg-foreground/10 text-foreground shadow-[inset_3px_0_0_var(--primary)]" : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      {count !== undefined && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>}
    </button>
  );
}

export function Sidebar({ view, labelId, labels, noteCount, isDark, onView, onLabel, onToggleTheme }: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r bg-[var(--sidebar)] p-3">
      <div className="mb-3 flex items-center gap-2.5 px-2 pt-1">
        <Bear className="size-9" />
        <span className="brand-gradient bg-clip-text text-xl font-extrabold tracking-tight text-transparent">Loaf</span>
      </div>
      <nav aria-label="Main" className="space-y-0.5">
        <Item active={view === "notes" && labelId === null} onClick={() => { onView("notes"); onLabel(null); }} icon={<NotebookPen />} count={noteCount}>Notes</Item>
        <Item active={view === "archive"} onClick={() => { onView("archive"); onLabel(null); }} icon={<Archive />}>Archive</Item>
      </nav>
      {labels.length > 0 && (
        <nav aria-label="Labels" className="mt-4 space-y-0.5">
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Labels</p>
          {labels.map(({ label, count }) => (
            <Item key={label.id} active={view === "notes" && labelId === label.id} onClick={() => { onView("notes"); onLabel(label.id); }} icon={<Tag />} count={count}>
              {label.name}
            </Item>
          ))}
        </nav>
      )}
      <div className="mt-auto flex items-center justify-between rounded-xl border bg-card/70 p-2 pl-3">
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">Loaf</p>
          <p className="text-xs text-muted-foreground">Keeping you company</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onToggleTheme} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>
              {isDark ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isDark ? "Light theme" : "Dark theme"}</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
