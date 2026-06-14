"use client";

import Link from "next/link";
import { useActionState } from "react";

import { useT } from "@/components/i18n-provider";
import { registerUser } from "@/server/actions/auth";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/30 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-[#D85A30]">{messages[0]}</p>;
}

export function RegisterForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-sm font-medium">
            {t.auth.firstName}
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder={t.auth.firstNamePlaceholder}
            className={inputClass}
          />
          <FieldError messages={state?.fieldErrors?.firstName} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-sm font-medium">
            {t.auth.lastName} <span className="text-neutral-400">({t.common.optional})</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder={t.auth.lastNamePlaceholder}
            className={inputClass}
          />
          <FieldError messages={state?.fieldErrors?.lastName} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {t.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t.auth.emailPlaceholder}
          className={inputClass}
        />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          {t.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder={t.auth.passwordPlaceholder}
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
        {pending ? t.auth.signingUp : t.auth.signUp}
      </button>

      <p className="text-center text-sm text-neutral-500">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-[#534AB7] hover:underline">
          {t.auth.signInLink}
        </Link>
      </p>
    </form>
  );
}
