import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60, "Máximo 60 caracteres"),
  description: z.string().trim().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
  color: z.string().regex(HEX_COLOR, "Color inválido"),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

// Colores sugeridos (paleta de marca + complementarios).
export const WORKSPACE_COLORS = [
  "#534AB7", // violeta marca
  "#D85A30", // coral
  "#1D9E75", // teal
  "#EF9F27", // ámbar
  "#2563EB", // azul
  "#DB2777", // rosa
  "#0891B2", // cian
  "#65A30D", // lima
] as const;
