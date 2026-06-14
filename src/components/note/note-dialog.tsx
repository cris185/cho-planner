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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createNote, updateNote, type NoteActionState } from "@/server/actions/note";

import { Markdown } from "./markdown";

const NONE = "none";

export type WorkspaceOption = { id: string; name: string };

export type NoteForDialog = {
  id: string;
  title: string;
  content: string;
  workspaceId: string | null;
  reminderAt: string | null; // ISO
};

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16); // YYYY-MM-DDTHH:mm
}

export function NoteDialog({
  workspaces,
  note,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  workspaces: WorkspaceOption[];
  note?: NoteForDialog;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(note);
  const action = isEdit ? updateNote : createNote;

  const [state, formAction, pending] = useActionState<NoteActionState, FormData>(
    action,
    undefined,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const [workspaceId, setWorkspaceId] = useState<string>(note?.workspaceId ?? NONE);
  const [content, setContent] = useState(note?.content ?? "");
  const [preview, setPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(isEdit ? "Nota actualizada" : "Nota creada");
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
          setWorkspaceId(note?.workspaceId ?? NONE);
          setContent(note?.content ?? "");
          setPreview(false);
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar nota" : "Nueva nota"}</DialogTitle>
          <DialogDescription>Notas en markdown, con recordatorio opcional.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col space-y-4">
          {isEdit && <input type="hidden" name="id" value={note!.id} />}
          {/* Select controla un estado; lo enviamos por hidden ("" = independiente) */}
          <input type="hidden" name="workspaceId" value={workspaceId === NONE ? "" : workspaceId} />

          <div className="space-y-1.5">
            <Label htmlFor="note-title">Título</Label>
            <Input
              id="note-title"
              name="title"
              required
              maxLength={150}
              defaultValue={note?.title ?? ""}
              placeholder="Título de la nota"
            />
            {state?.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Workspace</Label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Independiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Independiente</SelectItem>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-reminder">Recordatorio (opcional)</Label>
              <Input
                id="note-reminder"
                name="reminderAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(note?.reminderAt ?? null)}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="note-content">Contenido</Label>
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className={cn(
                  "text-xs font-medium transition",
                  preview ? "text-muted-foreground hover:text-foreground" : "text-primary",
                )}
              >
                {preview ? "← Editar" : "Vista previa"}
              </button>
            </div>
            {/* El textarea siempre presente (envía el value); en preview se oculta */}
            <Textarea
              id="note-content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe en markdown… **negrita**, listas, etc."
              className={cn("min-h-48 flex-1 font-mono text-sm", preview && "hidden")}
            />
            {preview && (
              <div className="min-h-48 flex-1 overflow-y-auto rounded-md border p-3">
                {content.trim() ? (
                  <Markdown content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nada que previsualizar.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
