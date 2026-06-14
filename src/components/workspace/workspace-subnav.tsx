"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function WorkspaceSubNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const t = useT();
  const base = `/workspaces/${workspaceId}`;

  const tabs = [
    { href: base, label: t.board.tabBoard, active: pathname === base },
    {
      href: `${base}/sprints`,
      label: t.board.tabSprints,
      active: pathname.startsWith(`${base}/sprints`),
    },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
            t.active
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
