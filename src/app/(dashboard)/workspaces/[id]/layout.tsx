import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/workspace/workspace-dialog";
import { WorkspaceSubNav } from "@/components/workspace/workspace-subnav";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/session";
import { WorkspaceIcon } from "@/lib/workspace-icons";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const t = getDictionary();
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${workspace.color}22` }}
          >
            <WorkspaceIcon name={workspace.icon} color={workspace.color} className="h-5 w-5" />
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
              <Pencil className="mr-1 h-4 w-4" /> {t.common.edit}
            </Button>
          }
        />
      </div>

      <WorkspaceSubNav workspaceId={workspace.id} />

      {children}
    </div>
  );
}
