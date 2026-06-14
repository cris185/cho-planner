import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary();

export const metadata: Metadata = {
  title: `${t.auth.signUp} · CHO Planner`,
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t.auth.createAccount}</h2>
        <p className="text-sm text-neutral-500">{t.auth.registerSubtitle}</p>
      </div>
      <RegisterForm />
    </div>
  );
}
