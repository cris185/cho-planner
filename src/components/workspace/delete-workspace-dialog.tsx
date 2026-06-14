"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/components/i18n-provider";
import { format } from "@/lib/i18n";
import { deleteWorkspace } from "@/server/actions/workspace";

export function DeleteWorkspaceDialog({
  id,
  name,
  open,
  onOpenChange,
}: {
  id: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteWorkspace(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t.workspace.deleted);
      onOpenChange(false);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{format(t.workspace.deleteTitle, { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t.workspace.deleteDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? t.common.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
