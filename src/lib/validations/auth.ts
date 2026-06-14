import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  lastName: z
    .string()
    .trim()
    .max(50)
    .optional()
    .or(z.literal("")),
  email: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
