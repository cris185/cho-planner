import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Convención `proxy` de Next 16 (reemplaza a `middleware`).
// Usa solo la config base (sin Prisma): la sesión JWT se decodifica con AUTH_SECRET.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  // Protege todo salvo rutas internas de Next, la API de auth y estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
