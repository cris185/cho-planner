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
import { createSprint, updateSprint, type SprintActionState } from "@/server/actions/sprint";

export type SprintForDialog = {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
};

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function SprintDialog({
  workspaceId,
  sprint,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  workspaceId: string;
  sprint?: SprintForDialog;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(sprint);
  const action = isEdit ? updateSprint : createSprint;

  const [state, formAction, pending] = useActionState<SprintActionState, FormData>(
    action,
    undefined,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(isEdit ? "Sprint actualizado" : "Sprint creado");
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar sprint" : "Nuevo sprint"}</DialogTitle>
          <DialogDescription>
            Agrupa tareas en un periodo con un objetivo y fechas.
          </DialogDescription>
        </DialogHeader>

        <form key={String(open)} action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {isEdit && <input type="hidden" name="id" value={sprint!.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Nombre</Label>
            <Input
              id="sprint-name"
              name="name"
              required
              maxLength={80}
              defaultValue={sprint?.name ?? ""}
              placeholder="Sprint 1, Semana de lanzamiento…"
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sprint-goal">Objetivo (opcional)</Label>
            <Input
              id="sprint-goal"
              name="goal"
              maxLength={200}
              defaultValue={sprint?.goal ?? ""}
              placeholder="¿Qué quieres lograr?"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sprint-description">Descripción (opcional)</Label>
            <Textarea
              id="sprint-description"
              name="description"
              maxLength={500}
              defaultValue={sprint?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-start">Inicio</Label>
              <Input
                id="sprint-start"
                name="startDate"
                type="date"
                required
                defaultValue={sprint ? toDateInput(sprint.startDate) : ""}
              />
              {state?.fieldErrors?.startDate && (
                <p className="text-xs text-destructive">{state.fieldErrors.startDate[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-end">Fin</Label>
              <Input
                id="sprint-end"
                name="endDate"
                type="date"
                required
                defaultValue={sprint ? toDateInput(sprint.endDate) : ""}
              />
              {state?.fieldErrors?.endDate && (
                <p className="text-xs text-destructive">{state.fieldErrors.endDate[0]}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
