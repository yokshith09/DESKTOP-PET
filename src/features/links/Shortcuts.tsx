import { useState } from "react";
import { ExternalLink, Link2, Plus, X } from "lucide-react";
import { Tile } from "@/features/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useShortcuts } from "@/hooks/useShortcuts";
import { parseLinks } from "@/lib/links";

export function AddLink({ onAdd }: { onAdd: (text: string, name?: string) => Promise<number> }) {
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
        <Button type="button" variant="outline" size="sm" className="h-7"><Plus />Add link</Button>
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

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, "") || url; } catch { return url; }
};

/** Pasted links as their own card. Click opens the page in the default browser. */
export function LinksCard({ className }: { className?: string }) {
  const { shortcuts, add, remove, open } = useShortcuts();
  return (
    <Tile className={className} title="Links" count={shortcuts.length} action={<AddLink onAdd={add} />}>
      {shortcuts.length === 0 ? (
        <div className="grid h-full place-items-center px-4 py-8 text-center">
          <div>
            <span className="mx-auto mb-2 grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Link2 className="size-4" /></span>
            <p className="text-[13px] font-medium">No links yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Paste the pages you open every day and launch them from here.</p>
          </div>
        </div>
      ) : (
        <ul>
          {shortcuts.map((s) => (
            <li key={s.id} className="group flex items-center gap-1 rounded-md hover:bg-accent/50">
              <button
                type="button" onClick={() => void open(s.url)} title={s.url} aria-label={`Open ${s.label}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-[13px] font-semibold uppercase text-primary">{s.label.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{s.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{hostOf(s.url)}</span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
              <button
                type="button" onClick={() => void remove(s.id)} aria-label={`Remove ${s.label}`}
                className="grid size-7 shrink-0 place-items-center rounded text-muted-foreground opacity-0 outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}
