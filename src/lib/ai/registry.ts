/**
 * Registro de proveedores y modelos de IA.
 *
 * IMPORTANTE: los IDs de modelo cambian con frecuencia. Verifica los IDs y
 * capacidades vigentes en la documentación de cada proveedor al desplegar.
 * `structuredOutput`:
 *   - "full": salida estructurada / tool use fiable.
 *   - "partial": devuelve JSON sin garantía estricta (más reintentos).
 */

export const AI_PROVIDERS = ["anthropic", "openai", "google"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export type StructuredSupport = "full" | "partial";

export interface ModelInfo {
  id: string;
  label: string;
  provider: AiProvider;
  structuredOutput: StructuredSupport;
}

export interface ProviderMeta {
  label: string;
  keyPrefixHint: string;
  consoleUrl: string;
  defaultModel: string;
}

export const PROVIDER_META: Record<AiProvider, ProviderMeta> = {
  anthropic: {
    label: "Anthropic (Claude)",
    keyPrefixHint: "sk-ant-…",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-sonnet-4-6",
  },
  openai: {
    label: "OpenAI (GPT)",
    keyPrefixHint: "sk-…",
    consoleUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
  },
  google: {
    label: "Google (Gemini)",
    keyPrefixHint: "AIza…",
    consoleUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-2.0-flash",
  },
};

export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  // Anthropic
  "claude-opus-4-8": {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    provider: "anthropic",
    structuredOutput: "full",
  },
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    structuredOutput: "full",
  },
  "claude-haiku-4-5-20251001": {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    structuredOutput: "full",
  },
  // OpenAI
  "gpt-4o": {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    structuredOutput: "full",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "openai",
    structuredOutput: "full",
  },
  // Google
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    structuredOutput: "full",
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google",
    structuredOutput: "partial",
  },
};

export function modelsForProvider(provider: AiProvider): ModelInfo[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.provider === provider);
}
