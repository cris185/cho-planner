import { z } from "zod";

export const subtaskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120, "Máximo 120 caracteres"),
  note: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
  weight: z.coerce.number().int().min(1).max(10),
});

export type SubtaskInput = z.infer<typeof subtaskSchema>;
