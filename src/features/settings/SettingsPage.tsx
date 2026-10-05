import { PageHeader, Panel } from "@/features/shell/PageHeader";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ipc } from "@/ipc";
import { useSetting } from "@/hooks/useTheme";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-medium text-muted-foreground">{title}</h2>
      <Panel className="divide-y px-5">{children}</Panel>
    </section>
  );
}

export function SettingsPage() {
  const [theme, setTheme] = useSetting("general.theme");
  const [font, setFont] = useSetting("general.font_size");
  const [autostart, setAutostart] = useSetting("general.autostart");
  const [tracking, setTracking] = useSetting("tracking.apps");
  const [excluded, setExcluded] = useSetting("tracking.exclude_apps");
  const [exclText, setExclText] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      <Section title="Appearance">
        <Row label="Theme" hint="System follows your operating system.">
          <ToggleGroup type="single" value={theme ?? "dark"} onValueChange={(v) => v && void setTheme(v as "system" | "light" | "dark")} aria-label="Theme">
            <ToggleGroupItem value="system">System</ToggleGroupItem>
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="Text size">
          <ToggleGroup type="single" value={font ?? "M"} onValueChange={(v) => v && void setFont(v as "S" | "M" | "L")} aria-label="Text size">
            <ToggleGroupItem value="S">Small</ToggleGroupItem>
            <ToggleGroupItem value="M">Default</ToggleGroupItem>
            <ToggleGroupItem value="L">Large</ToggleGroupItem>
          </ToggleGroup>
        </Row>
      </Section>
      <Section title="General">
        <Row label="Open Loaf at login" hint="Starts quietly in the tray.">
          <Switch checked={autostart ?? false} onCheckedChange={(v) => void setAutostart(v)} aria-label="Open Loaf at login" />
        </Row>
      </Section>
      <Section title="Privacy and tracking">
        <Row label="Track app usage" hint="Records which app is in front, and for how long, to show where your time went. Stays on this computer. Window titles and full web addresses are never stored.">
          <Switch checked={tracking ?? false} onCheckedChange={(v) => void setTracking(v)} aria-label="Track app usage" />
        </Row>
        <div className="py-3.5">
          <label htmlFor="excluded" className="text-[13px] font-medium">Never track these apps</label>
          <p className="mb-2 text-xs text-muted-foreground">One per line, for example “1Password.exe”.</p>
          <textarea
            id="excluded" rows={3} value={exclText ?? (excluded ?? []).join("\n")}
            onChange={(e) => setExclText(e.target.value)}
            onBlur={() => { if (exclText !== null) { void setExcluded(exclText.split("\n").map((x) => x.trim()).filter(Boolean)); setExclText(null); } }}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Row label="Delete tracked time" hint="Removes every recorded app and site session.">
          <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>Delete…</Button>
        </Row>
      </Section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-sm gap-3 p-5">
          <DialogTitle className="text-base font-semibold">Delete all tracked time?</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">Your notes, tasks and reminders are not affected. This can’t be undone.</DialogDescription>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => void ipc.usageDelete(null, null).then(() => { setConfirm(false); toast("Tracked time deleted"); })}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Section title="About">
        <Row label="Loaf" hint="Version 0.0.1 · Your notes, tasks and reminders are stored only on this computer." >
          <span />
        </Row>
      </Section>
    </div>
  );
}
