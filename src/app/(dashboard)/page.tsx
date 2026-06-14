import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/workspace/workspace-dialog";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();

  const workspaces = await db.workspace.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      icon: true,
      _count: { select: { tasks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Hola, {user.firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Tus espacios de trabajo.</p>
        </div>
        <WorkspaceDialog
          trigger={
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Nuevo workspace
            </Button>
          }
        />
      </div>

      {workspaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes workspaces. Crea el primero para empezar a organizar tus tareas.
          </p>
          <div className="mt-4 flex justify-center">
            <WorkspaceDialog
              trigger={
                <Button variant="outline">
                  <Plus className="mr-1 h-4 w-4" /> Crear workspace
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="group rounded-2xl border p-4 transition hover:shadow-sm"
              style={{ borderLeft: `4px solid ${ws.color}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${ws.color}22` }}
                >
                  {ws.icon ?? (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ws.color }}
                    />
                  )}
                </span>
                <h2 className="truncate font-semibold group-hover:text-primary">{ws.name}</h2>
              </div>
              {ws.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ws.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {ws._count.tasks} {ws._count.tasks === 1 ? "tarea" : "tareas"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
