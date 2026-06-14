"use client";

import { useT } from "@/components/i18n-provider";
import type { TaskStatusValue } from "@/lib/validations/task";

export function useStatusLabels(): Record<TaskStatusValue, string> {
  const t = useT();
  return {
    TODO: t.board.statusTodo,
    IN_PROGRESS: t.board.statusInProgress,
    DONE: t.board.statusDone,
  };
}
