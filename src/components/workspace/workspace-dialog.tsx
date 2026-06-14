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
import { WORKSPACE_COLORS } from "@/lib/validations/workspace";
import {
  createWorkspace,
  updateWorkspace,
  type WorkspaceActionState,
} from "@/server/actions/workspace";

export type WorkspaceForDialog = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
};

export function WorkspaceDialog({
  workspace,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  workspace?: WorkspaceForDialog;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(workspace);
  const action = isEdit ? updateWorkspace : createWorkspace;

  const [state, formAction, pending] = useActionState<WorkspaceActionState, FormData>(
    action,
    undefined,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [color, setColor] = useState(workspace?.color ?? WORKSPACE_COLORS[0]);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(isEdit ? "Workspace actualizado" : "Workspace creado");
      if (!isEdit && state.workspaceId) {
        router.push(`/workspaces/${state.workspaceId}`);
      }
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setColor(workspace?.color ?? WORKSPACE_COLORS[0]);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar workspace" : "Nuevo workspace"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cambia el nombre, color o detalles de este espacio."
              : "Crea un espacio para agrupar tus tareas, sprints y notas."}
          </DialogDescription>
        </DialogHeader>

        {/* key fuerza el reset de los campos al abrir/cerrar */}
        <form key={String(open)} action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={workspace!.id} />}
          <input type="hidden" name="color" value={color} />

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Nombre</Label>
            <Input
              id="ws-name"
              name="name"
              required
              maxLength={60}
              defaultValue={workspace?.name ?? ""}
              placeholder="Trabajo, Personal, Gimnasio…"
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-icon">Icono (emoji, opcional)</Label>
            <Input
              id="ws-icon"
              name="icon"
              maxLength={8}
              defaultValue={workspace?.icon ?? ""}
              placeholder="💼"
              className="w-24"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-description">Descripción (opcional)</Label>
            <Textarea
              id="ws-description"
              name="description"
              maxLength={300}
              defaultValue={workspace?.description ?? ""}
              placeholder="¿Para qué usas este espacio?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition",
                    color.toLowerCase() === c.toLowerCase()
                      ? "ring-2 ring-foreground"
                      : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
