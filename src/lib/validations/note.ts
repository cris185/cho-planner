import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(150, "Máximo 150 caracteres"),
  content: z.string().max(20000, "Demasiado largo").optional().or(z.literal("")),
  workspaceId: z.string().optional().or(z.literal("")), // "" = nota independiente
  reminderAt: z.string().optional().or(z.literal("")), // datetime-local
});

export type NoteInput = z.infer<typeof noteSchema>;
