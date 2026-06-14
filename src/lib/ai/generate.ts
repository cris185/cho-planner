import { generateObject } from "ai";

import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";

import { getModel } from "./provider";
import { MODEL_REGISTRY } from "./registry";
import { RoadmapSchema, type Roadmap } from "./schemas";

export class MissingApiKeyError extends Error {
  constructor(public provider: string) {
    super(`No hay API key configurada para ${provider}`);
    this.name = "MissingApiKeyError";
  }
}

const SYSTEM_PROMPT = `Eres un asistente de planificación. Descompones un objetivo en un plan accionable.
Reglas:
- Devuelve subtareas atómicas y concretas, ordenadas de forma lógica.
- Asigna a cada subtarea un peso (weight) de 1 a 10 según su importancia/esfuerzo.
- Estima minutos solo cuando tenga sentido; si no, omítelo.
- Responde en el mismo idioma que el objetivo del usuario.
- No inventes pasos irrelevantes; entre 3 y 12 subtareas suele ser ideal.`;

function buildPrompt(goal: string, context: string | undefined, retry: boolean): string {
  let prompt = `Objetivo: ${goal}`;
  if (context?.trim()) {
    prompt += `\n\nContexto adicional:\n${context.trim()}`;
  }
  if (retry) {
    prompt +=
      "\n\nTu respuesta anterior no cumplió el formato requerido. Responde EXCLUSIVAMENTE con la estructura solicitada, sin texto extra.";
  }
  return prompt;
}

/**
 * Genera un plan validado contra RoadmapSchema. Reintenta hasta 3 veces si la
 * validación o la llamada fallan. Lanza MissingApiKeyError si el usuario no
 * tiene clave para el proveedor del modelo.
 */
export async function generateRoadmap(opts: {
  userId: string;
  goal: string;
  context?: string;
  modelId: string;
}): Promise<Roadmap> {
  const info = MODEL_REGISTRY[opts.modelId];
  if (!info) {
    throw new Error(`Modelo desconocido: ${opts.modelId}`);
  }

  const row = await db.apiKey.findUnique({
    where: { userId_provider: { userId: opts.userId, provider: info.provider } },
  });
  if (!row) {
    throw new MissingApiKeyError(info.provider);
  }

  const model = getModel(opts.modelId, decrypt(row.encryptedKey));

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: RoadmapSchema,
        schemaName: "Roadmap",
        schemaDescription: "Plan de trabajo con subtareas priorizadas",
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(opts.goal, opts.context, attempt > 1),
      });
      return object;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo generar un plan válido.");
}
