"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { sprintSchema } from "@/lib/validations/sprint";

export type SprintActionState =
  | {
      success?: boolean;
      sprintId?: string;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

async function ownsWorkspace(workspaceId: string, userId: string) {
  const ws = await db.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true },
  });
  return Boolean(ws);
}

export async function createSprint(
  _prevState: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const user = await requireUser();

  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId) {
    return { error: "Workspace inválido." };
  }

  const parsed = sprintSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await ownsWorkspace(workspaceId, user.id))) {
    return { error: "No tienes acceso a ese workspace." };
  }

  const { name, goal, description, startDate, endDate } = parsed.data;

  const sprint = await db.sprint.create({
    data: {
      workspaceId,
      name,
      goal: goal || null,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/sprints`);
  revalidatePath("/", "layout");
  return { success: true, sprintId: sprint.id };
}

export async function updateSprint(
  _prevState: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const user = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Sprint inválido." };
  }

  const parsed = sprintSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, goal, description, startDate, endDate } = parsed.data;

  const result = await db.sprint.updateMany({
    where: { id, workspace: { userId: user.id } },
    data: {
      name,
      goal: goal || null,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  if (result.count === 0) {
    return { error: "No se encontró el sprint." };
  }

  revalidatePath("/", "layout");
  return { success: true, sprintId: id };
}

export async function deleteSprint(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.sprint.deleteMany({
    where: { id, workspace: { userId: user.id } },
  });

  if (result.count === 0) {
    return { error: "No se encontró el sprint." };
  }

  revalidatePath("/", "layout");
  return {};
}

/** Asigna (o quita, con sprintId=null) una tarea a un sprint del mismo workspace. */
export async function assignTaskToSprint(
  taskId: string,
  sprintId: string | null,
): Promise<{ error?: string }> {
  const user = await requireUser();

  const task = await db.task.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
    select: { workspaceId: true },
  });
  if (!task) {
    return { error: "No se encontró la tarea." };
  }

  // Si se asigna a un sprint, verifica que sea del mismo workspace.
  if (sprintId) {
    const sprint = await db.sprint.findFirst({
      where: { id: sprintId, workspaceId: task.workspaceId },
      select: { id: true },
    });
    if (!sprint) {
      return { error: "El sprint no pertenece a este workspace." };
    }
  }

  await db.task.update({
    where: { id: taskId },
    data: { sprintId },
  });

  revalidatePath("/", "layout");
  return {};
}
