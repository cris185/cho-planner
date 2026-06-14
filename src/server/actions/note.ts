"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { noteSchema } from "@/lib/validations/note";

export type NoteActionState =
  | {
      success?: boolean;
      noteId?: string;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

function parseReminder(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Devuelve el workspaceId si pertenece al usuario; null si es independiente; throw si es ajeno. */
async function resolveWorkspaceId(
  workspaceId: string | undefined,
  userId: string,
): Promise<string | null> {
  if (!workspaceId) return null;
  const ws = await db.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true },
  });
  if (!ws) throw new Error("workspace-not-owned");
  return ws.id;
}

export async function createNote(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const user = await requireUser();

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, content, workspaceId, reminderAt } = parsed.data;

  let resolvedWorkspaceId: string | null;
  try {
    resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);
  } catch {
    return { error: "No tienes acceso a ese workspace." };
  }

  const note = await db.note.create({
    data: {
      userId: user.id,
      title,
      content: content || "",
      workspaceId: resolvedWorkspaceId,
      reminderAt: parseReminder(reminderAt),
    },
  });

  revalidatePath("/notes");
  revalidatePath("/", "layout");
  return { success: true, noteId: note.id };
}

export async function updateNote(
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const user = await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Nota inválida." };
  }

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, content, workspaceId, reminderAt } = parsed.data;

  let resolvedWorkspaceId: string | null;
  try {
    resolvedWorkspaceId = await resolveWorkspaceId(workspaceId, user.id);
  } catch {
    return { error: "No tienes acceso a ese workspace." };
  }

  const result = await db.note.updateMany({
    where: { id, userId: user.id },
    data: {
      title,
      content: content || "",
      workspaceId: resolvedWorkspaceId,
      reminderAt: parseReminder(reminderAt),
    },
  });

  if (result.count === 0) {
    return { error: "No se encontró la nota." };
  }

  revalidatePath("/notes");
  revalidatePath("/", "layout");
  return { success: true, noteId: id };
}

export async function deleteNote(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const result = await db.note.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    return { error: "No se encontró la nota." };
  }

  revalidatePath("/notes");
  revalidatePath("/", "layout");
  return {};
}
