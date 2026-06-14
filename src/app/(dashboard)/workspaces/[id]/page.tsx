import { Plus } from "lucide-react";

import { GenerateRoadmapDialog, type ModelOption } from "@/components/ai/generate-roadmap-dialog";
import { Board } from "@/components/board/board";
import type { BoardTask, SprintOption } from "@/components/board/task-card";
import { TaskDialog } from "@/components/board/task-dialog";
import { Button } from "@/components/ui/button";
import {
  AI_PROVIDERS,
  MODEL_REGISTRY,
  PROVIDER_META,
  type AiProvider,
} from "@/lib/ai/registry";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { TaskStatusValue } from "@/lib/validations/task";

export default async function WorkspaceBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // El layout ya verificó la propiedad del workspace; filtramos por el id.
  const [rawTasks, sprints, dbUser] = await Promise.all([
    db.task.findMany({
      where: { workspaceId: id, workspace: { userId: user.id } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        weight: true,
        status: true,
        aiGenerated: true,
        dueDate: true,
        sprintId: true,
        calendarEvent: { select: { synced: true } },
        subtasks: {
          orderBy: { position: "asc" },
          select: { id: true, title: true, note: true, weight: true, done: true, position: true },
        },
      },
    }),
    db.sprint.findMany({
      where: { workspaceId: id },
      orderBy: { startDate: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findUnique({
      where: { id: user.id },
      select: {
        defaultProvider: true,
        apiKeys: { select: { provider: true } },
        googleAccount: { select: { id: true } },
      },
    }),
  ]);

  const tasks: BoardTask[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    weight: t.weight,
    status: t.status as TaskStatusValue,
    aiGenerated: t.aiGenerated,
    sprintId: t.sprintId,
    calendarSynced: Boolean(t.calendarEvent?.synced),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    subtasks: t.subtasks,
  }));

  const sprintOptions: SprintOption[] = sprints;

  // Modelos disponibles = los de proveedores con API key configurada.
  const configuredProviders = new Set(
    (dbUser?.apiKeys ?? [])
      .map((k) => k.provider)
      .filter((p): p is AiProvider => (AI_PROVIDERS as readonly string[]).includes(p)),
  );
  const models: ModelOption[] = Object.values(MODEL_REGISTRY)
    .filter((m) => configuredProviders.has(m.provider))
    .map((m) => ({ id: m.id, label: m.label, provider: m.provider }));

  const defaultProvider = dbUser?.defaultProvider as AiProvider | undefined;
  const defaultModelId =
    defaultProvider && configuredProviders.has(defaultProvider)
      ? PROVIDER_META[defaultProvider].defaultModel
      : models[0]?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <GenerateRoadmapDialog
          workspaceId={id}
          models={models}
          defaultModelId={defaultModelId}
        />
        <TaskDialog
          workspaceId={id}
          trigger={
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nueva tarea
            </Button>
          }
        />
      </div>

      <Board
        workspaceId={id}
        tasks={tasks}
        sprints={sprintOptions}
        googleConnected={Boolean(dbUser?.googleAccount)}
      />
    </div>
  );
}
