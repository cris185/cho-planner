export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Idioma activo de la app. Cambia este valor para alternar el idioma.
 * (Switch interno por código; no hay UI para cambiarlo todavía.)
 */
export const DEFAULT_LOCALE: Locale = "en";
