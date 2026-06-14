"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { useStatusLabels } from "@/components/use-status-labels";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type TaskStatusValue } from "@/lib/validations/task";
import { reorderTasks } from "@/server/actions/task";

import { TaskCard, TaskCardOverlay, type BoardTask, type SprintOption } from "./task-card";
import { TaskDialog } from "./task-dialog";

type Grouped = Record<TaskStatusValue, BoardTask[]>;

function group(tasks: BoardTask[]): Grouped {
  const out = { TODO: [], IN_PROGRESS: [], DONE: [] } as Grouped;
  for (const t of tasks) out[t.status].push(t);
  return out;
}

function Column({
  status,
  tasks,
  workspaceId,
  sprints,
  googleConnected,
  className,
}: {
  status: TaskStatusValue;
  tasks: BoardTask[];
  workspaceId: string;
  sprints: SprintOption[];
  googleConnected: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const t = useT();
  const statusLabels = useStatusLabels();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-2xl bg-muted/40 p-3 transition-colors",
        isOver && "bg-primary/5 ring-2 ring-primary/30",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{statusLabels[status]}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <TaskDialogTrigger workspaceId={workspaceId} status={status} />
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-16 flex-1 flex-col gap-2.5">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              {t.board.noTasks}
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                workspaceId={workspaceId}
                sprints={sprints}
                googleConnected={googleConnected}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function TaskDialogTrigger({
  workspaceId,
  status,
}: {
  workspaceId: string;
  status: TaskStatusValue;
}) {
  const t = useT();
  return (
    <TaskDialog
      workspaceId={workspaceId}
      defaultStatus={status}
      trigger={
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={t.board.addTask}>
          <Plus className="h-4 w-4" />
        </Button>
      }
    />
  );
}

export function Board({
  workspaceId,
  tasks,
  sprints,
  googleConnected = false,
}: {
  workspaceId: string;
  tasks: BoardTask[];
  sprints: SprintOption[];
  googleConnected?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Grouped>(() => group(tasks));
  const [mobileStatus, setMobileStatus] = useState<TaskStatusValue>("TODO");
  const [activeId, setActiveId] = useState<string | null>(null);
  const statusLabels = useStatusLabels();

  // Re-sincroniza con los datos del servidor cuando cambian (tras refresh).
  useEffect(() => {
    setItems(group(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = useMemo(
    () =>
      activeId
        ? TASK_STATUSES.flatMap((s) => items[s]).find((t) => t.id === activeId) ?? null
        : null,
    [activeId, items],
  );

  function findContainer(id: string): TaskStatusValue | null {
    if ((TASK_STATUSES as readonly string[]).includes(id)) return id as TaskStatusValue;
    return TASK_STATUSES.find((s) => items[s].some((t) => t.id === id)) ?? null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const from = findContainer(activeIdStr);
    const to = findContainer(overIdStr);
    if (!from || !to) return;

    const activeIndex = items[from].findIndex((t) => t.id === activeIdStr);
    if (activeIndex < 0) return;

    let overIndex: number;
    if ((TASK_STATUSES as readonly string[]).includes(overIdStr)) {
      overIndex = items[to].length;
    } else {
      const idx = items[to].findIndex((t) => t.id === overIdStr);
      overIndex = idx < 0 ? items[to].length : idx;
    }

    // Sin cambios reales.
    if (from === to && activeIndex === overIndex) return;

    const next: Grouped = {
      TODO: [...items.TODO],
      IN_PROGRESS: [...items.IN_PROGRESS],
      DONE: [...items.DONE],
    };
    const [moved] = next[from].splice(activeIndex, 1);
    const movedTask = { ...moved, status: to };
    next[to].splice(overIndex, 0, movedTask);

    setItems(next);

    const orderedIds = next[to].map((t) => t.id);
    void reorderTasks(workspaceId, to, orderedIds).then((res) => {
      if (res?.error) {
        toast.error(res.error);
        setItems(group(tasks)); // revierte al estado del servidor
      } else {
        router.refresh();
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Selector de estado (solo móvil) */}
      <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1 md:hidden">
        {TASK_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setMobileStatus(s)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
              mobileStatus === s
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {statusLabels[s]}
            <span className="ml-1 text-muted-foreground">{items[s].length}</span>
          </button>
        ))}
      </div>

      {/* Columnas: una sola vez. En móvil se oculta la no activa por CSS. */}
      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            tasks={items[s]}
            workspaceId={workspaceId}
            sprints={sprints}
            googleConnected={googleConnected}
            className={cn(mobileStatus === s ? "block" : "hidden", "md:flex")}
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <TaskCardOverlay task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
