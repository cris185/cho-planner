import { z } from "zod";

export const assistantSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(40, "Máximo 40 caracteres"),
  persona: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  avatarStyle: z.string().trim().min(1).max(30),
  seed: z.string().trim().min(1).max(60),
});

export type AssistantInput = z.infer<typeof assistantSchema>;
