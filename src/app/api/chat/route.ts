import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { auth } from "@/auth";
import { getModel } from "@/lib/ai/provider";
import { MODEL_REGISTRY } from "@/lib/ai/registry";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { messages, modelId } = (await req.json()) as {
    messages: UIMessage[];
    modelId: string;
  };

  const info = MODEL_REGISTRY[modelId];
  if (!info) {
    return new Response("Modelo inválido", { status: 400 });
  }

  const row = await db.apiKey.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: info.provider } },
  });
  if (!row) {
    return new Response(`No tienes una API key de ${info.provider}.`, { status: 400 });
  }

  const assistant = await db.assistant.findUnique({
    where: { userId: session.user.id },
    select: { name: true, persona: true },
  });
  const name = assistant?.name ?? "Asistente";
  const persona = assistant?.persona?.trim();

  const system = [
    `Eres "${name}", el asistente personal de ${session.user.firstName} dentro de CHO Planner, una app de gestión de tareas, sprints y notas.`,
    "Ayudas a planificar, priorizar y organizar el trabajo y la vida diaria. Responde en el idioma del usuario, de forma clara y concisa. Cuando propongas un plan, ofrécelo como pasos accionables.",
    persona ? `Tu personalidad y tono: ${persona}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const model = getModel(modelId, decrypt(row.encryptedKey));

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
