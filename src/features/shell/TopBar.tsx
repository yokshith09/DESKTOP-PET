import { forwardRef } from "react";
import { Moon, Plus, Search, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNewNote: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

export const TopBar = forwardRef<HTMLInputElement, Props>(({ query, onQuery, isDark, onToggleTheme, onNewNote }, ref) => (
  <header className="flex h-12 shrink-0 items-center gap-3 border-b px-5">
    <label className="group relative flex h-8 w-full max-w-md items-center">
      <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
      <input
        ref={ref}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (onQuery(""), e.currentTarget.blur())}
        placeholder="Search notes"
        aria-label="Search notes"
        className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-14 text-[13px] outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {query ? (
        <button type="button" aria-label="Clear search" onClick={() => onQuery("")} className="absolute right-2 grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent">
          <X className="size-3.5" />
        </button>
      ) : (
        <span className="pointer-events-none absolute right-2 flex gap-0.5">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd><Kbd>K</Kbd>
        </span>
      )}
    </label>
    <div className="ml-auto flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>
            {isDark ? <Sun /> : <Moon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isDark ? "Light theme" : "Dark theme"}</TooltipContent>
      </Tooltip>
      <Button onClick={onNewNote}><Plus />New note<Kbd className="ml-1 border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground">{isMac ? "⌘" : "Ctrl"} N</Kbd></Button>
    </div>
  </header>
));
TopBar.displayName = "TopBar";
