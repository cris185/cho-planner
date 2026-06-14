import { createAvatar, type Style } from "@dicebear/core";
import {
  adventurer,
  bottts,
  funEmoji,
  lorelei,
  micah,
  notionists,
} from "@dicebear/collection";

export const AVATAR_STYLES = {
  notionists: { label: "Notionists", style: notionists },
  lorelei: { label: "Lorelei", style: lorelei },
  adventurer: { label: "Adventurer", style: adventurer },
  micah: { label: "Micah", style: micah },
  funEmoji: { label: "Fun Emoji", style: funEmoji },
  bottts: { label: "Bottts (robot)", style: bottts },
} as const;

export type AvatarStyleKey = keyof typeof AVATAR_STYLES;
export const DEFAULT_AVATAR_STYLE: AvatarStyleKey = "notionists";

export function isAvatarStyle(value: string): value is AvatarStyleKey {
  return value in AVATAR_STYLES;
}

/** Genera el avatar como data-URI (SVG) a partir del estilo y la semilla. */
export function avatarDataUri(styleKey: string, seed: string): string {
  const entry = isAvatarStyle(styleKey)
    ? AVATAR_STYLES[styleKey]
    : AVATAR_STYLES[DEFAULT_AVATAR_STYLE];
  // Cada estilo tiene su propio tipo de Options; usamos el tipo del core para
  // pasar solo opciones comunes (seed).
  const style = entry.style as unknown as Style<Record<string, unknown>>;
  return createAvatar(style, { seed: seed || "asistente" }).toDataUri();
}
