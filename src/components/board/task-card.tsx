"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  FolderGit2,
  GripVertical,
  ListChecks,
  MoveRight,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/i18n-provider";
import { useStatusLabels } from "@/components/use-status-labels";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { format } from "@/lib/i18n";
import { TASK_STATUSES, weightColorVar, type TaskStatusValue } from "@/lib/validations/task";
import { syncTaskToCalendar, unsyncTaskFromCalendar } from "@/server/actions/calendar";
import { assignTaskToSprint } from "@/server/actions/sprint";
import { deleteTask, moveTask } from "@/server/actions/task";

import { TaskDetailSheet } from "./task-detail-sheet";
import { TaskDialog, type TaskForDialog } from "./task-dialog";

export type BoardSubtask = {
  id: string;
  title: string;
  note: string | null;
  weight: number;
  done: boolean;
  position: number;
};

export type BoardTask = TaskForDialog & {
  aiGenerated: boolean;
  sprintId: string | null;
  calendarSynced: boolean;
  subtasks: BoardSubtask[];
};

export type SprintOption = { id: string; name: string };

const dateFmt = new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: "2-digit", month: "short" });

/** Versión estática para el DragOverlay (sigue al cursor mientras se arrastra). */
export function TaskCardOverlay({ task }: { task: BoardTask }) {
  return (
    <div
      className="rounded-xl border bg-card p-3 pl-4 shadow-lg"
      style={{ borderLeft: `4px solid ${weightColorVar(task.weight)}` }}
    >
      <p className="text-sm font-medium break-words">{task.title}</p>
    </div>
  );
}

export function TaskCard({
  task,
  workspaceId,
  sprints = [],
  googleConnected = false,
}: {
  task: BoardTask;
  workspaceId: string;
  sprints?: SprintOption[];
  googleConnected?: boolean;
}) {
  const t = useT();
  const statusLabels = useStatusLabels();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSyncCalendar() {
    startTransition(async () => {
      const res = await syncTaskToCalendar(task.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t.task.toastUploaded);
        setSyncOpen(false);
        router.refresh();
      }
    });
  }

  function handleUnsyncCalendar() {
    startTransition(async () => {
      const res = await unsyncTaskFromCalendar(task.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(t.task.toastRemoved);
        router.refresh();
      }
    });
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  function handleMove(status: TaskStatusValue) {
    startTransition(async () => {
      const res = await moveTask(task.id, status);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleAssignSprint(value: string) {
    const sprintId = value === "none" ? null : value;
    if (sprintId === (task.sprintId ?? null)) return;
    startTransition(async () => {
      const res = await assignTaskToSprint(task.id, sprintId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(sprintId ? t.task.toastAssignedSprint : t.task.toastRemovedSprint);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t.task.toastDeleted);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.done).length;
  const progress = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        borderLeft: `4px solid ${weightColorVar(task.weight)}`,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="relative rounded-xl border bg-card p-3 pl-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          {...listeners}
          aria-label={t.task.dragTask}
          className="-ml-1 mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="min-w-0 flex-1 text-left text-sm font-medium break-words hover:text-primary"
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 -mt-1 h-6 w-6 shrink-0"
              aria-label={t.task.options}
              disabled={pending}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDetailOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4" /> {t.task.viewDetail}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> {t.common.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => handleMove(s)}>
                <MoveRight className="mr-2 h-4 w-4" />{" "}
                {format(t.task.moveTo, { status: statusLabels[s] })}
              </DropdownMenuItem>
            ))}
            {sprints.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderGit2 className="mr-2 h-4 w-4" /> {t.task.sprint}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={task.sprintId ?? "none"}
                    onValueChange={handleAssignSprint}
                  >
                    <DropdownMenuRadioItem value="none">{t.task.noSprint}</DropdownMenuRadioItem>
                    {sprints.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id}>
                        {s.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {googleConnected && (
              <>
                <DropdownMenuItem onSelect={() => setSyncOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {task.calendarSynced ? t.task.updateCalendar : t.task.uploadCalendar}
                </DropdownMenuItem>
                {task.calendarSynced && (
                  <DropdownMenuItem onSelect={handleUnsyncCalendar}>
                    <CalendarX className="mr-2 h-4 w-4" /> {t.task.removeCalendar}
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> {t.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      {subtaskTotal > 0 ? (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="mt-2.5 w-full space-y-1 text-left"
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3 w-3" /> {t.task.subtasks}
            </span>
            <span>
              {subtaskDone}/{subtaskTotal}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--status-done)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-primary"
        >
          <Plus className="h-3 w-3" /> {t.task.subtasks}
        </button>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[11px] font-semibold text-white"
          style={{ backgroundColor: weightColorVar(task.weight) }}
          title={format(t.task.weightTitle, { weight: task.weight })}
        >
          {task.weight}
        </span>
        {task.aiGenerated && (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[11px]">
            <Sparkles className="h-3 w-3" /> IA
          </Badge>
        )}
        {due && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dateFmt.format(due)}
          </span>
        )}
        {task.calendarSynced && (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-[var(--status-done)]"
            title={t.task.inCalendar}
          >
            <CalendarCheck className="h-3 w-3" />
          </span>
        )}
      </div>

      <TaskDialog
        workspaceId={workspaceId}
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <TaskDetailSheet
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => {
          setDetailOpen(false);
          setEditOpen(true);
        }}
      />

      <AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {task.calendarSynced ? t.task.syncTitleUpdate : t.task.syncTitleCreate}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {format(task.calendarSynced ? t.task.syncDescUpdate : t.task.syncDescCreate, {
                title: task.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSyncCalendar();
              }}
              disabled={pending}
            >
              {pending ? t.task.uploading : t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.task.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.task.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? t.common.deleting : t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
