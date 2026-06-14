"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { workspaceSchema } from "@/lib/validations/workspace";

export type WorkspaceActionState =
  | {
      success?: boolean;
      workspaceId?: string;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

export async function createWorkspace(
  _prevState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const user = await requireUser();

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, description, color, icon } = parsed.data;

  const count = await db.workspace.count({ where: { userId: user.id } });

  const workspace = await db.workspace.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
      color,
      icon: icon || null,
      position: count,
    },
  });

  revalidatePath("/", "layout");
  return { success: true, workspaceId: workspace.id };
}

export async function updateWorkspace(
  _prevState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const user = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Workspace inválido." };
  }

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, description, color, icon } = parsed.data;

  // updateMany con userId garantiza que solo el dueño puede editar.
  const result = await db.workspace.updateMany({
    where: { id, userId: user.id },
    data: {
      name,
      description: description || null,
      color,
      icon: icon || null,
    },
  });

  if (result.count === 0) {
    return { error: "No se encontró el workspace." };
  }

  revalidatePath("/", "layout");
  return { success: true, workspaceId: id };
}

export async function deleteWorkspace(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.workspace.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    return { error: "No se encontró el workspace." };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function reorderWorkspaces(orderedIds: string[]): Promise<void> {
  const user = await requireUser();

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.workspace.updateMany({
        where: { id, userId: user.id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath("/", "layout");
}
