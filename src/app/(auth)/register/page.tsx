import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta · CHO Planner",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Crea tu cuenta</h2>
        <p className="text-sm text-neutral-500">Empieza a organizar tu trabajo y tu día.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
