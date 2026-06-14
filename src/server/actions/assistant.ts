"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assistantSchema } from "@/lib/validations/assistant";

export type AssistantActionState =
  | {
      success?: boolean;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

export async function upsertAssistant(
  _prevState: AssistantActionState,
  formData: FormData,
): Promise<AssistantActionState> {
  const user = await requireUser();

  const parsed = assistantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, persona, avatarStyle, seed } = parsed.data;

  await db.assistant.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name,
      persona: persona || null,
      avatarStyle,
      avatarConfig: { seed },
    },
    update: {
      name,
      persona: persona || null,
      avatarStyle,
      avatarConfig: { seed },
    },
  });

  revalidatePath("/settings");
  revalidatePath("/chat");
  revalidatePath("/", "layout");
  return { success: true };
}
