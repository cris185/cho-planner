import { z } from "zod";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const STATUS_META: Record<TaskStatusValue, { label: string }> = {
  TODO: { label: "Por hacer" },
  IN_PROGRESS: { label: "En curso" },
  DONE: { label: "Hecho" },
};

export const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120, "Máximo 120 caracteres"),
  description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional().or(z.literal("")),
  weight: z.coerce.number().int().min(1, "Mínimo 1").max(10, "Máximo 10"),
  status: z.enum(TASK_STATUSES),
  dueDate: z.string().optional().or(z.literal("")),
});

export type TaskInput = z.infer<typeof taskSchema>;

/** Color de la barra de prioridad según el peso (1-10). */
export function weightColorVar(weight: number): string {
  if (weight >= 8) return "var(--priority-high)"; // coral
  if (weight >= 4) return "var(--status-progress)"; // ámbar
  return "var(--status-done)"; // teal
}
