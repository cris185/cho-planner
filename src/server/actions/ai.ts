"use server";

import { revalidatePath } from "next/cache";

import { generateRoadmap, MissingApiKeyError } from "@/lib/ai/generate";
import { MODEL_REGISTRY } from "@/lib/ai/registry";
import { RoadmapSchema, type Roadmap } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type GenerateResult = { roadmap?: Roadmap; error?: string; needKeyFor?: string };

export async function generateRoadmapAction(input: {
  workspaceId: string;
  goal: string;
  context?: string;
  modelId: string;
}): Promise<GenerateResult> {
  const user = await requireUser();

  if (!input.goal?.trim()) return { error: "Describe un objetivo." };
  if (!MODEL_REGISTRY[input.modelId]) return { error: "Modelo inválido." };

  const ws = await db.workspace.findFirst({
    where: { id: input.workspaceId, userId: user.id },
    select: { id: true },
  });
  if (!ws) return { error: "Workspace no encontrado." };

  try {
    const roadmap = await generateRoadmap({
      userId: user.id,
      goal: input.goal,
      context: input.context,
      modelId: input.modelId,
    });
    return { roadmap };
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return { error: `No tienes una API key de ${error.provider}.`, needKeyFor: error.provider };
    }
    console.error("generateRoadmap error:", error);
    return {
      error: "El modelo no pudo generar un plan válido. Revisa tu API key o inténtalo de nuevo.",
    };
  }
}

export async function createTasksFromRoadmap(
  workspaceId: string,
  roadmap: unknown,
): Promise<{ error?: string; taskId?: string }> {
  const user = await requireUser();

  const ws = await db.workspace.findFirst({
    where: { id: workspaceId, userId: user.id },
    select: { id: true },
  });
  if (!ws) return { error: "Workspace no encontrado." };

  // Re-validamos en el servidor: nunca confiamos en el cliente.
  const parsed = RoadmapSchema.safeParse(roadmap);
  if (!parsed.success) return { error: "El plan recibido no es válido." };

  const { goal, summary, subtasks } = parsed.data;
  const avgWeight = Math.round(subtasks.reduce((a, s) => a + s.weight, 0) / subtasks.length);

  const count = await db.task.count({ where: { workspaceId, status: "TODO" } });

  const task = await db.task.create({
    data: {
      workspaceId,
      title: goal,
      description: summary || null,
      weight: Math.min(10, Math.max(1, avgWeight)),
      status: "TODO",
      aiGenerated: true,
      position: count,
      subtasks: {
        create: subtasks.map((s, i) => ({
          title: s.title,
          weight: s.weight,
          note: s.estimatedMinutes ? `~${s.estimatedMinutes} min` : null,
          position: i,
        })),
      },
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath("/", "layout");
  return { taskId: task.id };
}
