"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerUser } from "@/server/actions/auth";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/30 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-[#D85A30]">{messages[0]}</p>;
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Tu nombre"
            className={inputClass}
          />
          <FieldError messages={state?.fieldErrors?.firstName} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-sm font-medium">
            Apellido <span className="text-neutral-400">(opcional)</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Tu apellido"
            className={inputClass}
          />
          <FieldError messages={state?.fieldErrors?.lastName} />
        </div>
      </div>

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
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Mínimo 8 caracteres"
          className={inputClass}
        />
        <FieldError messages={state?.fieldErrors?.password} />
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
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-[#534AB7] hover:underline">
          Entra
        </Link>
      </p>
    </form>
  );
}
