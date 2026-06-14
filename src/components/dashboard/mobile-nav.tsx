"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { WorkspaceForDialog } from "@/components/workspace/workspace-dialog";

import { SidebarContent } from "./sidebar-content";

export function MobileNav({ workspaces }: { workspaces: WorkspaceForDialog[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-3">
          <SheetTitle className="text-left text-primary">CHO Planner</SheetTitle>
        </SheetHeader>
        <SidebarContent workspaces={workspaces} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
