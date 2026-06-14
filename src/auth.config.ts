import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base, segura para el runtime edge (middleware).
 * NO importa Prisma ni bcrypt: solo define páginas y el callback de autorización.
 * Los providers que tocan la DB se añaden en `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/login", "/register"];
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));

      if (isPublic) {
        // Usuario ya autenticado no debería ver login/register.
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Resto de rutas: requieren sesión (redirige a /login si no la hay).
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
