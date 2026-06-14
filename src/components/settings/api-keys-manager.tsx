"use client";

import { Check, KeyRound, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_PROVIDERS, PROVIDER_META, type AiProvider } from "@/lib/ai/registry";
import {
  deleteApiKey,
  saveApiKey,
  setDefaultProvider,
  type ApiKeyActionState,
} from "@/server/actions/apikey";

export type ConfiguredKey = { provider: AiProvider; label: string | null };

function ProviderCard({
  provider,
  configured,
  label,
}: {
  provider: AiProvider;
  configured: boolean;
  label: string | null;
}) {
  const meta = PROVIDER_META[provider];
  const [state, formAction, pending] = useActionState<ApiKeyActionState, FormData>(
    saveApiKey,
    undefined,
  );
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(`Clave de ${meta.label} guardada`);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, meta.label, router]);

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteApiKey(provider);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Clave de ${meta.label} eliminada`);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{meta.label}</h3>
        </div>
        {configured ? (
          <Badge className="gap-1 bg-[var(--status-done)] text-white">
            <Check className="h-3 w-3" /> Configurada
          </Badge>
        ) : (
          <Badge variant="outline">Sin configurar</Badge>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Formato {meta.keyPrefixHint} ·{" "}
        <Link href={meta.consoleUrl} target="_blank" className="text-primary hover:underline">
          obtener clave
        </Link>
      </p>

      <form key={String(state?.success)} action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="provider" value={provider} />
        <div className="space-y-1.5">
          <Label htmlFor={`key-${provider}`}>
            {configured ? "Reemplazar clave" : "API key"}
          </Label>
          <Input
            id={`key-${provider}`}
            name="key"
            type="password"
            autoComplete="off"
            placeholder={meta.keyPrefixHint}
          />
          {state?.fieldErrors?.key && (
            <p className="text-xs text-destructive">{state.fieldErrors.key[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`label-${provider}`}>Etiqueta (opcional)</Label>
          <Input
            id={`label-${provider}`}
            name="label"
            maxLength={50}
            defaultValue={label ?? ""}
            placeholder="Mi cuenta personal"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          {configured && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export function ApiKeysManager({
  defaultProvider,
  configured,
}: {
  defaultProvider: string;
  configured: ConfiguredKey[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const configuredProviders = configured.map((c) => c.provider);
  const labelOf = (p: AiProvider) => configured.find((c) => c.provider === p)?.label ?? null;

  function handleDefaultChange(value: string) {
    startTransition(async () => {
      const res = await setDefaultProvider(value as AiProvider);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Proveedor por defecto actualizado");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold">Proveedor por defecto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El asistente usará este proveedor salvo que elijas otro al generar.
        </p>
        {configuredProviders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Añade al menos una API key abajo para elegir un proveedor.
          </p>
        ) : (
          <div className="mt-3 max-w-xs">
            <Select value={defaultProvider} onValueChange={handleDefaultChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {configuredProviders.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_META[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">API keys</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AI_PROVIDERS.map((p) => (
            <ProviderCard
              key={p}
              provider={p}
              configured={configuredProviders.includes(p)}
              label={labelOf(p)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
