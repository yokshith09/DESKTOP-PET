import { useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { greeting } from "@/lib/time";
import { Bear, type BearPose } from "./Bear";

export function Hero({ noteCount, openTasks, onNew }: { noteCount: number; openTasks: number; onNew: () => void }) {
  const [pose, setPose] = useState<BearPose>("idle");
  const stats = [
    { label: noteCount === 1 ? "note" : "notes", value: noteCount },
    { label: openTasks === 1 ? "task left today" : "tasks left today", value: openTasks },
  ];
  return (
    <section className="hero-mesh relative isolate overflow-hidden rounded-2xl border p-7 pr-56 min-h-60 max-md:pr-7">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
        <NotebookPen className="size-3.5" /> Your notebook
      </p>
      <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight">
        {greeting(new Date().getHours())}.
        <br />
        <span className="brand-gradient bg-clip-text text-transparent">Let’s make it a good day.</span>
      </h1>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {stats.map((s) => (
          <li key={s.label} className="rounded-xl border border-foreground/10 bg-background/55 px-3.5 py-2">
            <span className="mr-1.5 text-xl font-bold tabular-nums">{s.value}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </li>
        ))}
        <li>
          <Button onClick={onNew} className="h-[3.1rem]"><Plus />New note</Button>
        </li>
      </ul>
      <button
        type="button"
        aria-label="Say hi to Loaf"
        onMouseEnter={() => setPose("wave")}
        onMouseLeave={() => setPose("idle")}
        onFocus={() => setPose("wave")}
        onBlur={() => setPose("idle")}
        className="absolute -bottom-8 right-8 w-52 outline-none max-md:hidden"
      >
        <Bear pose={pose} className="bob drop-shadow-[0_14px_16px_rgb(0_0_0/0.35)]" />
      </button>
    </section>
  );
}
