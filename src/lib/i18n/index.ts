import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, es };

/** Devuelve el diccionario del idioma activo (o el indicado). Server-safe. */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Interpola `{clave}` dentro de una cadena del diccionario. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
