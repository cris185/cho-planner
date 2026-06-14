"use client";

import { createContext, useContext } from "react";

import type { Dictionary } from "@/lib/i18n";

const I18nContext = createContext<Dictionary | null>(null);

export function I18nProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>;
}

/** Hook para leer el diccionario activo en componentes cliente. */
export function useT(): Dictionary {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT debe usarse dentro de <I18nProvider>.");
  return ctx;
}
