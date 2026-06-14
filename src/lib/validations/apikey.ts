import { z } from "zod";

import { AI_PROVIDERS } from "@/lib/ai/registry";

export const apiKeySchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  key: z.string().trim().min(10, "La API key parece demasiado corta").max(300),
  label: z.string().trim().max(50).optional().or(z.literal("")),
});

export type ApiKeyInput = z.infer<typeof apiKeySchema>;
