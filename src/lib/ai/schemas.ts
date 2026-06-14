import { z } from "zod";

/**
 * Contrato de salida de la generación de planes. El modelo solo rellena esta
 * estructura; el código la valida antes de tocar la DB. Mismo contrato sin
 * importar el proveedor (Claude/GPT/Gemini producen los mismos campos).
 */
export const RoadmapSubtaskSchema = z.object({
  title: z.string().min(1).max(120).describe("Título corto y accionable de la subtarea"),
  weight: z.number().int().min(1).max(10).describe("Prioridad/peso 1-10 según importancia"),
  estimatedMinutes: z
    .number()
    .int()
    .positive()
    .max(100000)
    .nullable()
    .optional()
    .describe("Tiempo estimado en minutos, si aplica"),
});

export const RoadmapSchema = z.object({
  goal: z.string().min(1).max(200).describe("Reformulación breve del objetivo"),
  summary: z
    .string()
    .max(600)
    .optional()
    .describe("Resumen del enfoque del plan (1-2 frases)"),
  subtasks: z
    .array(RoadmapSubtaskSchema)
    .min(1)
    .max(20)
    .describe("Pasos concretos para lograr el objetivo, ordenados"),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;
export type RoadmapSubtask = z.infer<typeof RoadmapSubtaskSchema>;
