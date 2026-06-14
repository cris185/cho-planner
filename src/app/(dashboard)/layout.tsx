import Link from "next/link";

import { signOut } from "@/auth";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SidebarContent } from "@/components/dashboard/sidebar-content";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const t = getDictionary();

  const workspaces = await db.workspace.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    select: { id: true, name: true, description: true, color: true, icon: true },
  });

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 border-r md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-primary">
            CHO Planner
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent workspaces={workspaces} />
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav workspaces={workspaces} />
            <span className="text-base font-extrabold tracking-tight text-primary md:hidden">
              CHO Planner
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t.nav.hello}{" "}
              <span className="font-semibold text-foreground">{user.firstName}</span> 👋
            </span>
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                {t.nav.signOut}
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
