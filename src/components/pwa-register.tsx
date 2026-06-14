"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // Solo en producción: en dev el caché del SW estorba.
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: la PWA es un añadido, no debe romper la app.
    });
  }, []);

  return null;
}
