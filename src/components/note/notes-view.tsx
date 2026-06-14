"use client";

import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { syncNoteToCalendar, unsyncNoteFromCalendar } from "@/server/actions/calendar";
import { deleteNote } from "@/server/actions/note";

import { NoteDialog, type NoteForDialog, type WorkspaceOption } from "./note-dialog";

const reminderFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export type NoteCardData = NoteForDialog & {
  workspaceName: string | null;
  calendarSynced: boolean;
};

function NoteCard({
  note,
  workspaces,
  googleConnected,
}: {
  note: NoteCardData;
  workspaces: WorkspaceOption[];
  googleConnected: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const reminder = note.reminderAt ? new Date(note.reminderAt) : null;

  function handleSyncCalendar() {
    startTransition(async () => {
      const res = await syncNoteToCalendar(note.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Nota subida a Google Calendar");
        setSyncOpen(false);
        router.refresh();
      }
    });
  }

  function handleUnsyncCalendar() {
    startTransition(async () => {
      const res = await unsyncNoteFromCalendar(note.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Nota quitada de Google Calendar");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteNote(note.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Nota eliminada");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="min-w-0 flex-1 text-left font-semibold break-words hover:text-primary"
        >
          {note.title}
        </button>
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
            {googleConnected && reminder && (
              <DropdownMenuItem onSelect={() => setSyncOpen(true)}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                {note.calendarSynced ? "Actualizar en Calendar" : "Subir a Calendar"}
              </DropdownMenuItem>
            )}
            {googleConnected && note.calendarSynced && (
              <DropdownMenuItem onSelect={handleUnsyncCalendar}>
                <CalendarX className="mr-2 h-4 w-4" /> Quitar de Calendar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {note.content.trim() && (
        <p className="mt-1.5 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">
          {note.content}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {note.workspaceName ? (
          <Badge variant="secondary" className="text-[11px]">
            {note.workspaceName}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[11px]">
            Independiente
          </Badge>
        )}
        {reminder && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Bell className="h-3 w-3" />
            {reminderFmt.format(reminder)}
          </span>
        )}
        {note.calendarSynced && (
          <CalendarCheck
            className="h-3.5 w-3.5 text-[var(--status-done)]"
            aria-label="En Google Calendar"
          />
        )}
      </div>

      <NoteDialog
        workspaces={workspaces}
        note={note}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {note.calendarSynced ? "¿Actualizar en Google Calendar?" : "¿Subir a Google Calendar?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se {note.calendarSynced ? "actualizará" : "creará"} un evento en la fecha del recordatorio
              de “{note.title}”.
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
            <AlertDialogTitle>¿Eliminar “{note.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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

export function NotesView({
  notes,
  workspaces,
  googleConnected = false,
}: {
  notes: NoteCardData[];
  workspaces: WorkspaceOption[];
  googleConnected?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Notas</h1>
          <p className="mt-1 text-muted-foreground">Tus notas en markdown.</p>
        </div>
        <NoteDialog
          workspaces={workspaces}
          trigger={
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Nueva nota
            </Button>
          }
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar notas…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {notes.length === 0
            ? "Aún no tienes notas. Crea la primera con el botón de arriba."
            : "Ninguna nota coincide con tu búsqueda."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              workspaces={workspaces}
              googleConnected={googleConnected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
