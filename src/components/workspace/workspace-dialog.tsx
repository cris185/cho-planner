"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WORKSPACE_COLORS } from "@/lib/validations/workspace";
import { WORKSPACE_ICON_NAMES, WORKSPACE_ICONS } from "@/lib/workspace-icons";
import {
  createWorkspace,
  updateWorkspace,
  type WorkspaceActionState,
} from "@/server/actions/workspace";

export type WorkspaceForDialog = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
};

export function WorkspaceDialog({
  workspace,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  workspace?: WorkspaceForDialog;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useT();
  const isEdit = Boolean(workspace);
  const action = isEdit ? updateWorkspace : createWorkspace;

  const [state, formAction, pending] = useActionState<WorkspaceActionState, FormData>(
    action,
    undefined,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [color, setColor] = useState(workspace?.color ?? WORKSPACE_COLORS[0]);
  const [icon, setIcon] = useState(workspace?.icon ?? "");
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      toast.success(isEdit ? t.workspace.updated : t.workspace.created);
      if (!isEdit && state.workspaceId) {
        router.push(`/workspaces/${state.workspaceId}`);
      }
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setColor(workspace?.color ?? WORKSPACE_COLORS[0]);
          setIcon(workspace?.icon ?? "");
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t.workspace.editTitle : t.workspace.newTitle}</DialogTitle>
          <DialogDescription>
            {isEdit ? t.workspace.editDesc : t.workspace.createDesc}
          </DialogDescription>
        </DialogHeader>

        {/* key fuerza el reset de los campos al abrir/cerrar */}
        <form key={String(open)} action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={workspace!.id} />}
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">{t.workspace.name}</Label>
            <Input
              id="ws-name"
              name="name"
              required
              maxLength={60}
              defaultValue={workspace?.name ?? ""}
              placeholder={t.workspace.namePlaceholder}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.workspace.icon}</Label>
            <div className="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border p-2">
              <button
                type="button"
                onClick={() => setIcon("")}
                aria-label={t.workspace.noIcon}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md transition",
                  icon === "" ? "ring-2 ring-primary" : "hover:bg-accent",
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              </button>
              {WORKSPACE_ICON_NAMES.map((iconName) => {
                const Icon = WORKSPACE_ICONS[iconName];
                const selected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    aria-label={iconName}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md transition",
                      selected ? "ring-2 ring-primary" : "hover:bg-accent",
                    )}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: selected ? color : undefined }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-description">{t.workspace.description}</Label>
            <Textarea
              id="ws-description"
              name="description"
              maxLength={300}
              defaultValue={workspace?.description ?? ""}
              placeholder={t.workspace.descriptionPlaceholder}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.workspace.color}</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition",
                    color.toLowerCase() === c.toLowerCase()
                      ? "ring-2 ring-foreground"
                      : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t.common.saving : isEdit ? t.common.saveChanges : t.workspace.createBtn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
