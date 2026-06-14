"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { subtaskSchema } from "@/lib/validations/subtask";

export type SubtaskActionState =
  | {
      success?: boolean;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

/** Verifica que la tarea pertenezca al usuario (vía workspace). */
async function ownsTask(taskId: string, userId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, workspace: { userId } },
    select: { id: true },
  });
  return Boolean(task);
}

export async function createSubtask(
  _prevState: SubtaskActionState,
  formData: FormData,
): Promise<SubtaskActionState> {
  const user = await requireUser();

  const taskId = formData.get("taskId");
  if (typeof taskId !== "string" || !taskId) {
    return { error: "Tarea inválida." };
  }

  const parsed = subtaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await ownsTask(taskId, user.id))) {
    return { error: "No tienes acceso a esa tarea." };
  }

  const { title, note, weight } = parsed.data;
  const count = await db.subtask.count({ where: { taskId } });

  await db.subtask.create({
    data: { taskId, title, note: note || null, weight, position: count },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateSubtask(
  _prevState: SubtaskActionState,
  formData: FormData,
): Promise<SubtaskActionState> {
  const user = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Subtarea inválida." };
  }

  const parsed = subtaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, note, weight } = parsed.data;

  const result = await db.subtask.updateMany({
    where: { id, task: { workspace: { userId: user.id } } },
    data: { title, note: note || null, weight },
  });

  if (result.count === 0) {
    return { error: "No se encontró la subtarea." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleSubtask(id: string, done: boolean): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.subtask.updateMany({
    where: { id, task: { workspace: { userId: user.id } } },
    data: { done },
  });

  if (result.count === 0) {
    return { error: "No se encontró la subtarea." };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deleteSubtask(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.subtask.deleteMany({
    where: { id, task: { workspace: { userId: user.id } } },
  });

  if (result.count === 0) {
    return { error: "No se encontró la subtarea." };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function reorderSubtasks(
  taskId: string,
  orderedIds: string[],
): Promise<{ error?: string }> {
  const user = await requireUser();

  if (!(await ownsTask(taskId, user.id))) {
    return { error: "No tienes acceso a esa tarea." };
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.subtask.updateMany({
        where: { id, task: { workspace: { userId: user.id } } },
        data: { position: index },
      }),
    ),
  );

  revalidatePath("/", "layout");
  return {};
}
