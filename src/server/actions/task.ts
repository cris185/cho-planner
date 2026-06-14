"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { taskSchema, TASK_STATUSES, type TaskStatusValue } from "@/lib/validations/task";

export type TaskActionState =
  | {
      success?: boolean;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

function parseDueDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Verifica que el workspace pertenezca al usuario; devuelve su id o null. */
async function ownedWorkspaceId(workspaceId: string, userId: string) {
  const ws = await db.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true },
  });
  return ws?.id ?? null;
}

export async function createTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await requireUser();

  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId) {
    return { error: "Workspace inválido." };
  }

  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await ownedWorkspaceId(workspaceId, user.id))) {
    return { error: "No tienes acceso a ese workspace." };
  }

  const { title, description, weight, status, dueDate } = parsed.data;

  const count = await db.task.count({ where: { workspaceId, status } });

  await db.task.create({
    data: {
      workspaceId,
      title,
      description: description || null,
      weight,
      status,
      dueDate: parseDueDate(dueDate),
      position: count,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTask(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const user = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Tarea inválida." };
  }

  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, description, weight, status, dueDate } = parsed.data;

  const result = await db.task.updateMany({
    where: { id, workspace: { userId: user.id } },
    data: {
      title,
      description: description || null,
      weight,
      status,
      dueDate: parseDueDate(dueDate),
    },
  });

  if (result.count === 0) {
    return { error: "No se encontró la tarea." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.task.deleteMany({
    where: { id, workspace: { userId: user.id } },
  });

  if (result.count === 0) {
    return { error: "No se encontró la tarea." };
  }

  revalidatePath("/", "layout");
  return {};
}

/**
 * Persiste el nuevo orden de una columna tras un drag & drop.
 * `orderedIds` es la lista completa de tareas de esa columna en su nuevo orden;
 * a cada una se le asigna `position = índice` y `status` (cubre el caso de que
 * la tarea arrastrada venga de otra columna).
 */
export async function reorderTasks(
  workspaceId: string,
  status: TaskStatusValue,
  orderedIds: string[],
): Promise<{ error?: string }> {
  const user = await requireUser();

  if (!TASK_STATUSES.includes(status)) {
    return { error: "Estado inválido." };
  }
  if (!(await ownedWorkspaceId(workspaceId, user.id))) {
    return { error: "No tienes acceso a ese workspace." };
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.task.updateMany({
        where: { id, workspace: { userId: user.id } },
        data: { status, position: index },
      }),
    ),
  );

  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath("/", "layout");
  return {};
}

export async function moveTask(
  id: string,
  status: TaskStatusValue,
): Promise<{ error?: string }> {
  const user = await requireUser();

  if (!TASK_STATUSES.includes(status)) {
    return { error: "Estado inválido." };
  }

  const task = await db.task.findFirst({
    where: { id, workspace: { userId: user.id } },
    select: { workspaceId: true },
  });
  if (!task) {
    return { error: "No se encontró la tarea." };
  }

  const count = await db.task.count({ where: { workspaceId: task.workspaceId, status } });

  await db.task.update({
    where: { id },
    data: { status, position: count },
  });

  revalidatePath(`/workspaces/${task.workspaceId}`);
  revalidatePath("/", "layout");
  return {};
}
