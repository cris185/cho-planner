export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#534AB7]">
            CHO Planner
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tu gestor de tareas con asistente de IA
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-neutral-900">
          {children}
        </div>
      </div>
    </div>
  );
}
