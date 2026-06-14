import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/workspace/workspace-dialog";
import { WorkspaceSubNav } from "@/components/workspace/workspace-subnav";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const workspace = await db.workspace.findFirst({
    where: { id, userId: user.id },
  });

  if (!workspace) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: `${workspace.color}22` }}
          >
            {workspace.icon ?? (
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: workspace.color }}
              />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{workspace.name}</h1>
            {workspace.description && (
              <p className="mt-1 text-sm text-muted-foreground">{workspace.description}</p>
            )}
          </div>
        </div>

        <WorkspaceDialog
          workspace={{
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            color: workspace.color,
            icon: workspace.icon,
          }}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Button>
          }
        />
      </div>

      <WorkspaceSubNav workspaceId={workspace.id} />

      {children}
    </div>
  );
}
