"use client";

import { Calendar, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { STATUS_META, weightColorVar } from "@/lib/validations/task";
import {
  createSubtask,
  deleteSubtask,
  toggleSubtask,
  updateSubtask,
} from "@/server/actions/subtask";

import type { BoardSubtask, BoardTask } from "./task-card";

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function SubtaskRow({
  subtask,
  onChanged,
}: {
  subtask: BoardSubtask;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [note, setNote] = useState(subtask.note ?? "");
  const [weight, setWeight] = useState(subtask.weight);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await toggleSubtask(subtask.id, !subtask.done);
      if (res.error) toast.error(res.error);
      else onChanged();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteSubtask(subtask.id);
      if (res.error) toast.error(res.error);
      else onChanged();
    });
  }

  function save() {
    const fd = new FormData();
    fd.set("id", subtask.id);
    fd.set("title", title);
    fd.set("note", note);
    fd.set("weight", String(weight));
    startTransition(async () => {
      const res = await updateSubtask(undefined, fd);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.fieldErrors) {
        toast.error("Revisa los campos de la subtarea.");
      } else {
        setEditing(false);
        onChanged();
      }
    });
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border p-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Peso</span>
          <input
            type="range"
            min={1}
            max={10}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: weightColorVar(weight) }}
          >
            {weight}
          </span>
        </div>
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
            <X className="mr-1 h-3.5 w-3.5" /> Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={pending}>
            <Check className="mr-1 h-3.5 w-3.5" /> Guardar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-accent/50">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={subtask.done ? "Marcar como pendiente" : "Marcar como hecha"}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
          subtask.done
            ? "border-[var(--status-done)] bg-[var(--status-done)] text-white"
            : "border-input hover:border-primary",
        )}
      >
        {subtask.done && <Check className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm break-words", subtask.done && "text-muted-foreground line-through")}>
          {subtask.title}
        </p>
        {subtask.note && <p className="text-xs text-muted-foreground">{subtask.note}</p>}
      </div>

      <span
        className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold text-white"
        style={{ backgroundColor: weightColorVar(subtask.weight) }}
      >
        {subtask.weight}
      </span>

      <div className="flex shrink-0 opacity-0 transition group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={remove} disabled={pending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onEdit,
}: {
  task: BoardTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [subs, setSubs] = useState<BoardSubtask[]>(task.subtasks);
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSubs(task.subtasks);
  }, [task.subtasks]);

  const total = subs.length;
  const done = subs.filter((s) => s.done).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const due = task.dueDate ? new Date(task.dueDate) : null;

  function refresh() {
    router.refresh();
  }

  function addSubtask() {
    const title = newTitle.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("title", title);
    fd.set("weight", "5");
    startTransition(async () => {
      const res = await createSubtask(undefined, fd);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.fieldErrors) {
        toast.error("Revisa el título de la subtarea.");
      } else {
        setNewTitle("");
        refresh();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="break-words pr-6">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Detalle de la tarea y subtareas</SheetDescription>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
              {STATUS_META[task.status].label}
            </span>
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: weightColorVar(task.weight) }}
            >
              peso {task.weight}
            </span>
            {due && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {dateFmt.format(due)}
              </span>
            )}
            <Button size="sm" variant="outline" className="ml-auto" onClick={onEdit}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Editar tarea
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {task.description && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descripción
              </h4>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subtareas
              </h4>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {done}/{total}
                </span>
              )}
            </div>

            {total > 0 && (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[var(--status-done)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="space-y-0.5">
              {subs.map((s) => (
                <SubtaskRow key={s.id} subtask={s} onChanged={refresh} />
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Añadir subtarea…"
                maxLength={120}
              />
              <Button onClick={addSubtask} disabled={pending || !newTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
