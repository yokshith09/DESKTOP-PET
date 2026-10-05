import { useState, type ReactNode } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TileHandleContext } from "@/features/shell/TileHandle";
import { ipc } from "@/ipc";
import { cn } from "@/lib/utils";

export type TileId = "agenda" | "time" | "links" | "activity" | "done";
export const DEFAULT_ORDER: TileId[] = ["agenda", "time", "links", "activity", "done"];
const KEY = ["prefs", "ui.overview_order"] as const;

/** Stored order, with anything unknown dropped and anything missing put back at the end. */
export function cleanOrder(stored: unknown): TileId[] {
  const known = Array.isArray(stored) ? stored.filter((x): x is TileId => DEFAULT_ORDER.includes(x as TileId)) : [];
  const unique = [...new Set(known)];
  return [...unique, ...DEFAULT_ORDER.filter((id) => !unique.includes(id))];
}

export function useTileOrder() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: KEY, queryFn: async () => cleanOrder(await ipc.prefsGet("ui.overview_order")) });
  const order = data ?? DEFAULT_ORDER;
  const save = async (next: TileId[]) => {
    qc.setQueryData(KEY, next);
    await ipc.prefsSet("ui.overview_order", next);
  };
  return { order, save, isDefault: order.every((id, i) => id === DEFAULT_ORDER[i]) };
}

interface TileSpec { span: string; title: string; node: ReactNode }

function Handle({ title, ...props }: { title: string } & Record<string, unknown>) {
  return (
    <button
      type="button" aria-label={`Move ${title}`} title="Drag to move (or focus and press Space, then the arrow keys)"
      {...props}
      className="grid size-6 cursor-grab touch-none place-items-center rounded text-muted-foreground/60 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function SortableTile({ id, spec }: { id: TileId; spec: TileSpec }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("min-h-96 min-w-0", spec.span, isDragging && "relative z-10 opacity-90 shadow-2xl ring-1 ring-primary/50")}
    >
      <TileHandleContext.Provider value={<Handle title={spec.title} {...attributes} {...listeners} />}>
        {spec.node}
      </TileHandleContext.Provider>
    </div>
  );
}

/** Overview tiles in a 12-column grid. Drag a tile by its grip (or use the keyboard) to reorder; the order is remembered. */
export function MovableTiles({ tiles }: { tiles: Record<TileId, TileSpec> }) {
  const { order, save, isDefault } = useTileOrder();
  const [active, setActive] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onEnd = (e: DragEndEvent) => {
    setActive(false);
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    void save(arrayMove(order, order.indexOf(a.id as TileId), order.indexOf(over.id as TileId)));
  };
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setActive(true)} onDragCancel={() => setActive(false)} onDragEnd={onEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className={cn("grid gap-4 lg:auto-rows-[31rem] lg:grid-cols-12", active && "select-none")}>
            {order.map((id) => <SortableTile key={id} id={id} spec={tiles[id]} />)}
          </div>
        </SortableContext>
      </DndContext>
      {!isDefault && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => void save(DEFAULT_ORDER)}><RotateCcw />Reset layout</Button>
        </div>
      )}
    </div>
  );
}
