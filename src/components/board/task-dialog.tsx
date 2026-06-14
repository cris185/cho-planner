"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  TASK_STATUSES,
  weightColorVar,
  type TaskStatusValue,
} from "@/lib/validations/task";
import { createTask, updateTask, type TaskActionState } from "@/server/actions/task";

export type TaskForDialog = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  status: TaskStatusValue;
  dueDate: string | null; // ISO o null
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function TaskDialog({
  workspaceId,
  task,
  defaultStatus = "TODO",
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  workspaceId: string;
  task?: TaskForDialog;
  defaultStatus?: TaskStatusValue;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(task);
  const action = isEdit ? updateTask : createTask;

  const [state, formAction, pending] = useActionState<TaskActionState, FormData>(
    action,
    undefined,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const [weight, setWeight] = useState(task?.weight ?? 5);
  const [status, setStatus] = useState<TaskStatusValue>(task?.status ?? defaultStatus);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(isEdit ? "Tarea actualizada" : "Tarea creada");
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router, setOpen]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setWeight(task?.weight ?? 5);
          setStatus(task?.status ?? defaultStatus);
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            Define qué hay que hacer, su prioridad y en qué columna va.
          </DialogDescription>
        </DialogHeader>

        <form key={String(open)} action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {isEdit && <input type="hidden" name="id" value={task!.id} />}
          <input type="hidden" name="weight" value={weight} />
          <input type="hidden" name="status" value={status} />

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              name="title"
              required
              maxLength={120}
              defaultValue={task?.title ?? ""}
              placeholder="¿Qué hay que hacer?"
            />
            {state?.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Descripción (opcional)</Label>
            <Textarea
              id="task-description"
              name="description"
              maxLength={2000}
              defaultValue={task?.description ?? ""}
              placeholder="Detalles, contexto, criterios…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-weight">Prioridad / peso</Label>
              <span
                className="inline-flex h-6 min-w-6 items-center justify-center rounded-md px-2 text-xs font-semibold text-white"
                style={{ backgroundColor: weightColorVar(weight) }}
              >
                {weight}
              </span>
            </div>
            <input
              id="task-weight"
              type="range"
              min={1}
              max={10}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    status === s
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due">Fecha límite (opcional)</Label>
            <Input
              id="task-due"
              name="dueDate"
              type="date"
              defaultValue={toDateInput(task?.dueDate ?? null)}
              className="w-48"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
