import { useState } from "react";
import { ExternalLink, Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useShortcuts } from "@/hooks/useShortcuts";
import { parseLinks } from "@/lib/links";

function AddLink({ onAdd }: { onAdd: (text: string, name?: string) => Promise<number> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const found = parseLinks(text);

  const submit = async () => {
    if (found.length === 0) return setError("Paste a link that starts with http, https or mailto, or looks like example.com.");
    const n = await onAdd(text, name);
    if (n === 0) return setError("Those links are already saved.");
    setText(""); setName(""); setError(""); setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(""); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Plus />Add link</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="space-y-1.5">
            <label htmlFor="link-text" className="text-xs font-medium text-muted-foreground">Paste links</label>
            <textarea
              id="link-text" autoFocus value={text} onChange={(e) => { setText(e.target.value); setError(""); }} rows={3}
              placeholder={"https://linear.app/team\ngithub.com/you/repo"}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">{found.length ? `${found.length} link${found.length > 1 ? "s" : ""} found` : "One per line is fine."}</p>
          </div>
          {found.length === 1 && (
            <div className="space-y-1.5">
              <label htmlFor="link-name" className="text-xs font-medium text-muted-foreground">Name (optional)</label>
              <Input id="link-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={found[0]?.label ?? ""} />
            </div>
          )}
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!text.trim()}>Save</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Pasted links as chips. Click opens the page in the default browser. */
export function Shortcuts() {
  const { shortcuts, add, remove, open } = useShortcuts();
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Shortcuts">
      <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Link2 className="size-3.5" />Shortcuts</span>
      {shortcuts.map((s) => (
        <span key={s.id} className="group inline-flex h-7 items-center overflow-hidden rounded-md border bg-muted/50 text-[12px]">
          <button
            type="button" onClick={() => void open(s.url)} title={s.url} aria-label={`Open ${s.label}`}
            className="flex h-full items-center gap-1.5 px-2 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden className="grid size-4 place-items-center rounded-[4px] bg-primary/15 text-[9px] font-bold uppercase text-primary">{s.label.charAt(0)}</span>
            <span className="max-w-32 truncate">{s.label}</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </button>
          <button
            type="button" onClick={() => void remove(s.id)} aria-label={`Remove ${s.label}`}
            className="grid h-full w-0 place-items-center overflow-hidden text-muted-foreground outline-none transition-[width] hover:bg-destructive/15 hover:text-destructive focus-visible:w-6 focus-visible:ring-2 focus-visible:ring-ring group-hover:w-6"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <AddLink onAdd={add} />
    </div>
  );
}
