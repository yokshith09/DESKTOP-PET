import { useState } from "react";
import { PageHeader, Panel } from "@/features/shell/PageHeader";
import { Bear, type BearPose } from "@/features/shell/Bear";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSetting } from "@/hooks/useTheme";

const SIZES = { S: 64, M: 96, L: 128 } as const;

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

export function CharacterPage() {
  const [pose, setPose] = useState<BearPose>("idle");
  const [visible, setVisible] = useSetting("pet.visible");
  const [size, setSize] = useSetting("pet.size");
  const [opacity, setOpacity] = useSetting("pet.opacity");
  const [onTop, setOnTop] = useSetting("pet.always_on_top");
  const px = SIZES[size ?? "M"];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Character" description="Your desktop companion. It sits on your screen and stays out of the way." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel className="flex flex-col items-center justify-between gap-6 p-6">
          <div className="grid min-h-72 w-full flex-1 place-items-center rounded-lg border bg-muted/40 [background-image:radial-gradient(circle_at_center,var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
            <Bear pose={pose} className="size-56" />
          </div>
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Loaf the bear</p>
              <p className="text-xs text-muted-foreground">Default character</p>
            </div>
            <ToggleGroup type="single" value={pose} onValueChange={(v) => v && setPose(v as BearPose)} aria-label="Preview pose">
              <ToggleGroupItem value="idle">Idle</ToggleGroupItem>
              <ToggleGroupItem value="wave">Wave</ToggleGroupItem>
              <ToggleGroupItem value="sleep">Sleepy</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Panel>

        <Panel className="divide-y px-5">
          <Row label="Show on desktop" hint="Hide the companion without quitting Loaf.">
            <Switch checked={visible ?? true} onCheckedChange={(v) => void setVisible(v)} aria-label="Show on desktop" />
          </Row>
          <Row label="Size" hint={`${px} px on screen`}>
            <ToggleGroup type="single" value={size ?? "M"} onValueChange={(v) => v && void setSize(v as "S" | "M" | "L")} aria-label="Size">
              <ToggleGroupItem value="S">S</ToggleGroupItem>
              <ToggleGroupItem value="M">M</ToggleGroupItem>
              <ToggleGroupItem value="L">L</ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label="Opacity" hint={`${opacity ?? 100}%`}>
            <Slider className="w-36" min={20} max={100} step={5} value={[opacity ?? 100]} onValueChange={([v]) => v !== undefined && void setOpacity(v)} aria-label="Opacity" />
          </Row>
          <Row label="Always on top" hint="Keep the companion above other windows.">
            <Switch checked={onTop ?? true} onCheckedChange={(v) => void setOnTop(v)} aria-label="Always on top" />
          </Row>
          <div className="py-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Preview at each size</p>
            <div className="flex items-end gap-6">
              {(Object.entries(SIZES) as [string, number][]).map(([k, v]) => (
                <figure key={k} className="text-center" style={{ opacity: (opacity ?? 100) / 100 }}>
                  <Bear className="mx-auto" style={{ width: v, height: v }} />
                  <figcaption className="mt-1 text-[11px] text-muted-foreground">{k} · {v}px</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
