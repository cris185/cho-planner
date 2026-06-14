import { AssistantEditor, type AssistantInitial } from "@/components/assistant/assistant-editor";
import { ApiKeysManager, type ConfiguredKey } from "@/components/settings/api-keys-manager";
import { GoogleConnection } from "@/components/settings/google-connection";
import { AI_PROVIDERS, type AiProvider } from "@/lib/ai/registry";
import { DEFAULT_AVATAR_STYLE } from "@/lib/avatar";
import { isGoogleConfigured } from "@/lib/google/oauth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const user = await requireUser();
  const { google: googleStatus } = await searchParams;

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      defaultProvider: true,
      firstName: true,
      apiKeys: { select: { provider: true, label: true } },
      assistant: { select: { name: true, persona: true, avatarStyle: true, avatarConfig: true } },
      googleAccount: { select: { id: true } },
    },
  });

  const assistant = dbUser?.assistant;
  const seedFromConfig =
    assistant?.avatarConfig && typeof assistant.avatarConfig === "object"
      ? (assistant.avatarConfig as { seed?: string }).seed
      : undefined;

  const assistantInitial: AssistantInitial = {
    name: assistant?.name ?? "Asistente",
    persona: assistant?.persona ?? "",
    avatarStyle: assistant?.avatarStyle ?? DEFAULT_AVATAR_STYLE,
    seed: seedFromConfig ?? dbUser?.firstName ?? "asistente",
  };

  const configured: ConfiguredKey[] = (dbUser?.apiKeys ?? [])
    .filter((k) => (AI_PROVIDERS as readonly string[]).includes(k.provider))
    .map((k) => ({ provider: k.provider as AiProvider, label: k.label }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ajustes</h1>
        <p className="mt-1 text-muted-foreground">
          Conecta tus modelos de IA. Tus claves se guardan cifradas y nunca salen de tu instancia.
        </p>
      </div>

      <AssistantEditor initial={assistantInitial} />

      <ApiKeysManager
        defaultProvider={dbUser?.defaultProvider ?? "anthropic"}
        configured={configured}
      />

      <GoogleConnection
        connected={Boolean(dbUser?.googleAccount)}
        configured={isGoogleConfigured()}
        statusParam={googleStatus}
      />
    </div>
  );
}
