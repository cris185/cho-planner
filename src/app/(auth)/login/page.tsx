import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar · CHO Planner",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Bienvenido de vuelta</h2>
        <p className="text-sm text-neutral-500">Entra para continuar con tus tareas.</p>
      </div>
      <LoginForm />
    </div>
  );
}
