import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary();

export const metadata: Metadata = {
  title: `${t.auth.signIn} · CHO Planner`,
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t.auth.welcomeBack}</h2>
        <p className="text-sm text-neutral-500">{t.auth.loginSubtitle}</p>
      </div>
      <LoginForm />
    </div>
  );
}
