"use client";

import Link from "next/link";
import { useActionState } from "react";

import { authenticate } from "@/server/actions/auth";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/30 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[#D85A30]" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#463db0] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-[#534AB7] hover:underline">
          Crea una
        </Link>
      </p>
    </form>
  );
}
