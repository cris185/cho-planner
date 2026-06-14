"use client";

import {
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  CalendarX,
  MoreVertical,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  syncSprintToCalendar,
  unsyncSprintFromCalendar,
} from "@/server/actions/calendar";
import { deleteSprint } from "@/server/actions/sprint";

import { SprintDialog, type SprintForDialog } from "./sprint-dialog";

const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

export type SprintCardData = SprintForDialog & {
  taskCount: number;
  doneCount: number;
  calendarSynced: boolean;
};

export function SprintCard({
  workspaceId,
  sprint,
  googleConnected = false,
}: {
  workspaceId: string;
  sprint: SprintCardData;
  googleConnected?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const progress = sprint.taskCount > 0 ? Math.round((sprint.doneCount / sprint.taskCount) * 100) : 0;

  function handleSyncCalendar() {
    startTransition(async () => {
      const res = await syncSprintToCalendar(sprint.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Sprint subido a Google Calendar");
        setSyncOpen(false);
        router.refresh();
      }
    });
  }

  function handleUnsyncCalendar() {
    startTransition(async () => {
      const res = await unsyncSprintFromCalendar(sprint.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Sprint quitado de Google Calendar");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSprint(sprint.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Sprint eliminado");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold break-words">{sprint.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6" aria-label="Opciones">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {googleConnected && (
              <>
                <DropdownMenuItem onSelect={() => setSyncOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {sprint.calendarSynced ? "Actualizar en Calendar" : "Subir a Calendar"}
                </DropdownMenuItem>
                {sprint.calendarSynced && (
                  <DropdownMenuItem onSelect={handleUnsyncCalendar}>
                    <CalendarX className="mr-2 h-4 w-4" /> Quitar de Calendar
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sprint.goal && (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {sprint.goal}
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5" />
        {dateFmt.format(new Date(sprint.startDate))} — {dateFmt.format(new Date(sprint.endDate))}
        {sprint.calendarSynced && (
          <CalendarCheck className="h-3.5 w-3.5 text-[var(--status-done)]" aria-label="En Google Calendar" />
        )}
      </p>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {sprint.taskCount} {sprint.taskCount === 1 ? "tarea" : "tareas"}
          </span>
          <span>
            {sprint.doneCount}/{sprint.taskCount} hechas
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--status-done)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <SprintDialog
        workspaceId={workspaceId}
        sprint={sprint}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sprint.calendarSynced ? "¿Actualizar en Google Calendar?" : "¿Subir a Google Calendar?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se {sprint.calendarSynced ? "actualizará" : "creará"} un evento que abarca las fechas del
              sprint “{sprint.name}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSyncCalendar();
              }}
              disabled={pending}
            >
              {pending ? "Subiendo…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{sprint.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Las tareas no se borran: solo dejan de pertenecer a este sprint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
