"use client";

import { Calendar, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disconnectGoogle } from "@/server/actions/calendar";

const STATUS_MESSAGES: Record<string, { type: "success" | "error"; text: string }> = {
  connected: { type: "success", text: "Google Calendar conectado." },
  denied: { type: "error", text: "Cancelaste la conexión con Google." },
  invalid_state: { type: "error", text: "La conexión falló (estado inválido). Inténtalo de nuevo." },
  no_refresh: { type: "error", text: "Google no entregó un token. Revoca el acceso y reconecta." },
  no_identity: { type: "error", text: "No se pudo identificar tu cuenta de Google." },
  not_configured: { type: "error", text: "El operador no ha configurado las credenciales de Google." },
  error: { type: "error", text: "Ocurrió un error conectando con Google." },
};

export function GoogleConnection({
  connected,
  configured,
  statusParam,
}: {
  connected: boolean;
  configured: boolean;
  statusParam?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || !statusParam) return;
    shown.current = true;
    const msg = STATUS_MESSAGES[statusParam];
    if (msg) toast[msg.type](msg.text);
    // Limpia el query param de la URL.
    router.replace("/settings");
  }, [statusParam, router]);

  function handleDisconnect() {
    startTransition(async () => {
      const res = await disconnectGoogle();
      if (res.error) toast.error(res.error);
      else {
        toast.success("Google Calendar desconectado");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Google Calendar</h2>
        </div>
        {connected && (
          <Badge className="gap-1 bg-[var(--status-done)] text-white">
            <Check className="h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Conecta tu cuenta para subir tareas con fecha a tu calendario. Siempre con tu confirmación;
        tu token se guarda cifrado.
      </p>

      {!configured ? (
        <p className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          El operador de esta instancia aún no ha configurado <code>GOOGLE_CLIENT_ID</code> y{" "}
          <code>GOOGLE_CLIENT_SECRET</code>. Consulta el README de instalación.
        </p>
      ) : connected ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={handleDisconnect}
          disabled={pending}
        >
          {pending ? "Desconectando…" : "Desconectar"}
        </Button>
      ) : (
        <Button asChild size="sm" className="mt-3">
          <a href="/api/google/connect">Conectar Google Calendar</a>
        </Button>
      )}
    </section>
  );
}
