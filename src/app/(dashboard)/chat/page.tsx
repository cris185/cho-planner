import { ChatWindow, type ChatModelOption } from "@/components/chat/chat-window";
import {
  AI_PROVIDERS,
  MODEL_REGISTRY,
  PROVIDER_META,
  type AiProvider,
} from "@/lib/ai/registry";
import { DEFAULT_AVATAR_STYLE } from "@/lib/avatar";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ChatPage() {
  const user = await requireUser();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      defaultProvider: true,
      apiKeys: { select: { provider: true } },
      assistant: { select: { name: true, avatarStyle: true, avatarConfig: true } },
    },
  });

  const configured = new Set(
    (dbUser?.apiKeys ?? [])
      .map((k) => k.provider)
      .filter((p): p is AiProvider => (AI_PROVIDERS as readonly string[]).includes(p)),
  );

  const models: ChatModelOption[] = Object.values(MODEL_REGISTRY)
    .filter((m) => configured.has(m.provider))
    .map((m) => ({ id: m.id, label: m.label }));

  const defaultProvider = dbUser?.defaultProvider as AiProvider | undefined;
  const defaultModelId =
    defaultProvider && configured.has(defaultProvider)
      ? PROVIDER_META[defaultProvider].defaultModel
      : models[0]?.id;

  const assistant = dbUser?.assistant;
  const assistantName = assistant?.name ?? "Asistente";
  const avatarStyle = assistant?.avatarStyle ?? DEFAULT_AVATAR_STYLE;
  const avatarSeed =
    assistant?.avatarConfig && typeof assistant.avatarConfig === "object"
      ? (assistant.avatarConfig as { seed?: string }).seed ?? assistantName
      : assistantName;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Asistente</h1>
        <p className="mt-1 text-muted-foreground">Chatea con {assistantName} para planificar tu trabajo.</p>
      </div>

      <ChatWindow
        assistantName={assistantName}
        avatarStyle={avatarStyle}
        avatarSeed={avatarSeed}
        models={models}
        defaultModelId={defaultModelId}
      />
    </div>
  );
}
