"use client";

import {
  Home,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Settings,
  StickyNote,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DeleteWorkspaceDialog } from "@/components/workspace/delete-workspace-dialog";
import {
  WorkspaceDialog,
  type WorkspaceForDialog,
} from "@/components/workspace/workspace-dialog";

function NavItem({
  workspace,
  active,
  onNavigate,
}: {
  workspace: WorkspaceForDialog;
  active: boolean;
  onNavigate?: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
        active ? "bg-accent font-medium" : "hover:bg-accent/60",
      )}
    >
      <Link
        href={`/workspaces/${workspace.id}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs"
          style={{ backgroundColor: `${workspace.color}22` }}
        >
          {workspace.icon ? (
            <span>{workspace.icon}</span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: workspace.color }} />
          )}
        </span>
        <span className="truncate">{workspace.name}</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 transition group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Opciones del workspace"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceDialog workspace={workspace} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWorkspaceDialog
        id={workspace.id}
        name={workspace.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

export function SidebarContent({
  workspaces,
  onNavigate,
}: {
  workspaces: WorkspaceForDialog[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
          pathname === "/" ? "bg-accent font-medium" : "hover:bg-accent/60",
        )}
      >
        <Home className="h-4 w-4" />
        Inicio
      </Link>

      <Link
        href="/notes"
        onClick={onNavigate}
        className={cn(
          "-mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
          pathname.startsWith("/notes") ? "bg-accent font-medium" : "hover:bg-accent/60",
        )}
      >
        <StickyNote className="h-4 w-4" />
        Notas
      </Link>

      <Link
        href="/chat"
        onClick={onNavigate}
        className={cn(
          "-mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
          pathname.startsWith("/chat") ? "bg-accent font-medium" : "hover:bg-accent/60",
        )}
      >
        <MessageSquare className="h-4 w-4" />
        Asistente
      </Link>

      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workspaces
        </span>
        <WorkspaceDialog
          trigger={
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Nuevo workspace">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {workspaces.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            Aún no tienes workspaces. Crea el primero con el botón +.
          </p>
        ) : (
          workspaces.map((ws) => (
            <NavItem
              key={ws.id}
              workspace={ws}
              active={pathname === `/workspaces/${ws.id}`}
              onNavigate={onNavigate}
            />
          ))
        )}
      </nav>

      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
          pathname.startsWith("/settings") ? "bg-accent font-medium" : "hover:bg-accent/60",
        )}
      >
        <Settings className="h-4 w-4" />
        Ajustes
      </Link>
    </div>
  );
}
