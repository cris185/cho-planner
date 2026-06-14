import { Plus } from "lucide-react";

import { SprintCard, type SprintCardData } from "@/components/sprint/sprint-card";
import { SprintDialog } from "@/components/sprint/sprint-dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [sprints, googleAccount] = await Promise.all([
    db.sprint.findMany({
      where: { workspaceId: id, workspace: { userId: user.id } },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        goal: true,
        description: true,
        startDate: true,
        endDate: true,
        tasks: { select: { status: true } },
        calendarEvent: { select: { synced: true } },
      },
    }),
    db.googleAccount.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);

  const data: SprintCardData[] = sprints.map((s) => ({
    id: s.id,
    name: s.name,
    goal: s.goal,
    description: s.description,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    taskCount: s.tasks.length,
    doneCount: s.tasks.filter((t) => t.status === "DONE").length,
    calendarSynced: Boolean(s.calendarEvent?.synced),
  }));

  const googleConnected = Boolean(googleAccount);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SprintDialog
          workspaceId={id}
          trigger={
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nuevo sprint
            </Button>
          }
        />
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay sprints. Crea uno para agrupar tareas en un periodo con objetivo.
          </p>
          <div className="mt-4 flex justify-center">
            <SprintDialog
              workspaceId={id}
              trigger={
                <Button variant="outline">
                  <Plus className="mr-1 h-4 w-4" /> Crear sprint
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((sprint) => (
            <SprintCard
              key={sprint.id}
              workspaceId={id}
              sprint={sprint}
              googleConnected={googleConnected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
