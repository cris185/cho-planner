"use server";

import { revalidatePath } from "next/cache";

import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import {
  deleteGoogleEvent,
  upsertGoogleEvent,
  type CalendarEventInput,
} from "@/lib/google/calendar";
import { requireUser } from "@/lib/session";

type GoogleAccountRow = { encryptedRefresh: string; calendarId: string };
type CalEventRow = { id: string; googleEventId: string | null } | null;

/** Crea/actualiza el evento en Google y la fila CalendarEvent. Devuelve su id. */
async function pushEvent(
  account: GoogleAccountRow,
  current: CalEventRow,
  payload: CalendarEventInput,
): Promise<string> {
  const refreshToken = decrypt(account.encryptedRefresh);
  const googleEventId = await upsertGoogleEvent({
    refreshToken,
    calendarId: account.calendarId,
    googleEventId: current?.googleEventId ?? null,
    event: payload,
  });

  const data = {
    googleEventId,
    title: payload.summary,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt ?? null,
    synced: true,
    lastSyncedAt: new Date(),
  };

  if (current) {
    await db.calendarEvent.update({ where: { id: current.id }, data });
    return current.id;
  }
  const created = await db.calendarEvent.create({ data });
  return created.id;
}

/** Borra el evento en Google (si existe). */
async function removeEvent(account: GoogleAccountRow | null, current: { googleEventId: string | null }) {
  if (account && current.googleEventId) {
    await deleteGoogleEvent({
      refreshToken: decrypt(account.encryptedRefresh),
      calendarId: account.calendarId,
      googleEventId: current.googleEventId,
    });
  }
}

export async function disconnectGoogle(): Promise<{ error?: string }> {
  const user = await requireUser();
  await db.googleAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}

// ---------- Tareas ----------

export async function syncTaskToCalendar(taskId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  if (!account) return { error: "No has conectado Google Calendar." };

  const task = await db.task.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
    include: { calendarEvent: true },
  });
  if (!task) return { error: "Tarea no encontrada." };
  if (!task.dueDate) return { error: "La tarea necesita una fecha límite para subirla a Calendar." };

  try {
    const calendarEventId = await pushEvent(account, task.calendarEvent, {
      summary: task.title,
      description: task.description,
      startsAt: task.dueDate,
    });
    if (!task.calendarEventId) {
      await db.task.update({ where: { id: task.id }, data: { calendarEventId } });
    }
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("syncTaskToCalendar error:", error);
    return { error: "No se pudo subir a Google Calendar. Reconecta tu cuenta e inténtalo de nuevo." };
  }
}

export async function unsyncTaskFromCalendar(taskId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const task = await db.task.findFirst({
    where: { id: taskId, workspace: { userId: user.id } },
    include: { calendarEvent: true },
  });
  if (!task?.calendarEvent) return { error: "La tarea no está en Calendar." };

  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  try {
    await removeEvent(account, task.calendarEvent);
    await db.task.update({ where: { id: task.id }, data: { calendarEventId: null } });
    await db.calendarEvent.delete({ where: { id: task.calendarEvent.id } });
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("unsyncTaskFromCalendar error:", error);
    return { error: "No se pudo quitar de Google Calendar." };
  }
}

// ---------- Sprints ----------

export async function syncSprintToCalendar(sprintId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  if (!account) return { error: "No has conectado Google Calendar." };

  const sprint = await db.sprint.findFirst({
    where: { id: sprintId, workspace: { userId: user.id } },
    include: { calendarEvent: true },
  });
  if (!sprint) return { error: "Sprint no encontrado." };

  try {
    const calendarEventId = await pushEvent(account, sprint.calendarEvent, {
      summary: `🏁 ${sprint.name}`,
      description: sprint.goal ?? sprint.description,
      startsAt: sprint.startDate,
      endsAt: sprint.endDate,
    });
    if (!sprint.calendarEventId) {
      await db.sprint.update({ where: { id: sprint.id }, data: { calendarEventId } });
    }
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("syncSprintToCalendar error:", error);
    return { error: "No se pudo subir el sprint a Google Calendar." };
  }
}

export async function unsyncSprintFromCalendar(sprintId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const sprint = await db.sprint.findFirst({
    where: { id: sprintId, workspace: { userId: user.id } },
    include: { calendarEvent: true },
  });
  if (!sprint?.calendarEvent) return { error: "El sprint no está en Calendar." };

  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  try {
    await removeEvent(account, sprint.calendarEvent);
    await db.sprint.update({ where: { id: sprint.id }, data: { calendarEventId: null } });
    await db.calendarEvent.delete({ where: { id: sprint.calendarEvent.id } });
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("unsyncSprintFromCalendar error:", error);
    return { error: "No se pudo quitar el sprint de Google Calendar." };
  }
}

// ---------- Notas ----------

export async function syncNoteToCalendar(noteId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  if (!account) return { error: "No has conectado Google Calendar." };

  const note = await db.note.findFirst({
    where: { id: noteId, userId: user.id },
    include: { calendarEvent: true },
  });
  if (!note) return { error: "Nota no encontrada." };
  if (!note.reminderAt) return { error: "La nota necesita un recordatorio para subirla a Calendar." };

  try {
    const calendarEventId = await pushEvent(account, note.calendarEvent, {
      summary: `📝 ${note.title}`,
      description: note.content.slice(0, 500),
      startsAt: note.reminderAt,
    });
    if (!note.calendarEventId) {
      await db.note.update({ where: { id: note.id }, data: { calendarEventId } });
    }
    revalidatePath("/notes");
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("syncNoteToCalendar error:", error);
    return { error: "No se pudo subir la nota a Google Calendar." };
  }
}

export async function unsyncNoteFromCalendar(noteId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const note = await db.note.findFirst({
    where: { id: noteId, userId: user.id },
    include: { calendarEvent: true },
  });
  if (!note?.calendarEvent) return { error: "La nota no está en Calendar." };

  const account = await db.googleAccount.findUnique({ where: { userId: user.id } });
  try {
    await removeEvent(account, note.calendarEvent);
    await db.note.update({ where: { id: note.id }, data: { calendarEventId: null } });
    await db.calendarEvent.delete({ where: { id: note.calendarEvent.id } });
    revalidatePath("/notes");
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    console.error("unsyncNoteFromCalendar error:", error);
    return { error: "No se pudo quitar la nota de Google Calendar." };
  }
}
