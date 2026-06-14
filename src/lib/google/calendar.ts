import { google } from "googleapis";

import { clientFromRefreshToken } from "./oauth";

export type CalendarEventInput = {
  summary: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
};

function toGoogleEvent(input: CalendarEventInput) {
  const start = input.startsAt;
  const end = input.endsAt ?? new Date(start.getTime() + 60 * 60 * 1000); // +1h por defecto
  return {
    summary: input.summary,
    description: input.description ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

/**
 * Crea o actualiza un evento. Si `googleEventId` existe, lo actualiza (patch);
 * si no, crea uno nuevo. Devuelve el id del evento en Google.
 */
export async function upsertGoogleEvent(opts: {
  refreshToken: string;
  calendarId: string;
  googleEventId: string | null;
  event: CalendarEventInput;
}): Promise<string> {
  const calendar = google.calendar({ version: "v3", auth: clientFromRefreshToken(opts.refreshToken) });
  const requestBody = toGoogleEvent(opts.event);

  if (opts.googleEventId) {
    const res = await calendar.events.patch({
      calendarId: opts.calendarId,
      eventId: opts.googleEventId,
      requestBody,
    });
    return res.data.id ?? opts.googleEventId;
  }

  const res = await calendar.events.insert({
    calendarId: opts.calendarId,
    requestBody,
  });
  if (!res.data.id) {
    throw new Error("Google no devolvió el id del evento.");
  }
  return res.data.id;
}

export async function deleteGoogleEvent(opts: {
  refreshToken: string;
  calendarId: string;
  googleEventId: string;
}): Promise<void> {
  const calendar = google.calendar({ version: "v3", auth: clientFromRefreshToken(opts.refreshToken) });
  try {
    await calendar.events.delete({
      calendarId: opts.calendarId,
      eventId: opts.googleEventId,
    });
  } catch (error: unknown) {
    // Si ya no existe en Google (410/404), lo tratamos como borrado.
    const status = (error as { code?: number })?.code;
    if (status !== 404 && status !== 410) throw error;
  }
}
