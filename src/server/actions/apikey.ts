"use server";

import { revalidatePath } from "next/cache";

import { AI_PROVIDERS, type AiProvider } from "@/lib/ai/registry";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { apiKeySchema } from "@/lib/validations/apikey";

export type ApiKeyActionState =
  | {
      success?: boolean;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

export async function saveApiKey(
  _prevState: ApiKeyActionState,
  formData: FormData,
): Promise<ApiKeyActionState> {
  const user = await requireUser();

  const parsed = apiKeySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { provider, key, label } = parsed.data;
  const encryptedKey = encrypt(key);

  await db.apiKey.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    create: { userId: user.id, provider, encryptedKey, label: label || null },
    update: { encryptedKey, label: label || null },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteApiKey(provider: AiProvider): Promise<{ error?: string }> {
  const user = await requireUser();

  if (!AI_PROVIDERS.includes(provider)) {
    return { error: "Proveedor inválido." };
  }

  await db.apiKey.deleteMany({ where: { userId: user.id, provider } });

  revalidatePath("/settings");
  return {};
}

export async function setDefaultProvider(provider: AiProvider): Promise<{ error?: string }> {
  const user = await requireUser();

  if (!AI_PROVIDERS.includes(provider)) {
    return { error: "Proveedor inválido." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { defaultProvider: provider },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}
