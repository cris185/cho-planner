import { z } from "zod";

export const sprintSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
    goal: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
    description: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
    startDate: z.string().min(1, "Fecha de inicio requerida"),
    endDate: z.string().min(1, "Fecha de fin requerida"),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "La fecha de fin debe ser igual o posterior al inicio",
    path: ["endDate"],
  });

export type SprintInput = z.infer<typeof sprintSchema>;
