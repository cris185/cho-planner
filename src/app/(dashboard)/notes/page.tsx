import { NotesView, type NoteCardData } from "@/components/note/notes-view";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function NotesPage() {
  const user = await requireUser();

  const [notes, workspaces, googleAccount] = await Promise.all([
    db.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        workspaceId: true,
        reminderAt: true,
        workspace: { select: { name: true } },
        calendarEvent: { select: { synced: true } },
      },
    }),
    db.workspace.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    db.googleAccount.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);

  const data: NoteCardData[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    workspaceId: n.workspaceId,
    reminderAt: n.reminderAt ? n.reminderAt.toISOString() : null,
    workspaceName: n.workspace?.name ?? null,
    calendarSynced: Boolean(n.calendarEvent?.synced),
  }));

  return (
    <NotesView notes={data} workspaces={workspaces} googleConnected={Boolean(googleAccount)} />
  );
}
