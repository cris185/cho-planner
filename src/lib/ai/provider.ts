import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { MODEL_REGISTRY } from "./registry";

/**
 * Instancia el modelo del AI SDK correcto según el `modelId` y la API key del
 * usuario (ya descifrada). Solo se usa server-side.
 */
export function getModel(modelId: string, apiKey: string): LanguageModel {
  const info = MODEL_REGISTRY[modelId];
  if (!info) {
    throw new Error(`Modelo desconocido: ${modelId}`);
  }

  switch (info.provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    default:
      throw new Error(`Proveedor no soportado: ${info.provider}`);
  }
}
