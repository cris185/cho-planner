import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Devuelve el usuario de la sesión o redirige a /login.
 * Úsalo en server components y server actions para asegurar autenticación
 * y obtener el `id` con el que filtrar todas las queries.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}
