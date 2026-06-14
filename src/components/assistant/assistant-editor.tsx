"use client";

import { Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { AVATAR_STYLES } from "@/lib/avatar";
import { upsertAssistant, type AssistantActionState } from "@/server/actions/assistant";

import { AssistantAvatar } from "./assistant-avatar";

export type AssistantInitial = {
  name: string;
  persona: string;
  avatarStyle: string;
  seed: string;
};

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function AssistantEditor({ initial }: { initial: AssistantInitial }) {
  const [state, formAction, pending] = useActionState<AssistantActionState, FormData>(
    upsertAssistant,
    undefined,
  );
  const [avatarStyle, setAvatarStyle] = useState(initial.avatarStyle);
  const [seed, setSeed] = useState(initial.seed);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success("Asistente actualizado");
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <section className="rounded-2xl border p-4">
      <h2 className="font-semibold">Tu asistente</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dale un nombre, una personalidad y una cara. Su personalidad se usa en el chat.
      </p>

      <form action={formAction} className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr]">
        {/* Avatar + controles de avatar */}
        <div className="flex flex-col items-center gap-3">
          <AssistantAvatar styleKey={avatarStyle} seed={seed} size={96} className="border" />
          <input type="hidden" name="avatarStyle" value={avatarStyle} />
          <input type="hidden" name="seed" value={seed} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSeed(randomSeed())}
          >
            <Shuffle className="mr-1 h-3.5 w-3.5" /> Aleatorio
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assistant-name">Nombre</Label>
            <Input
              id="assistant-name"
              name="name"
              required
              maxLength={40}
              defaultValue={initial.name}
              placeholder="Nova, Jarvis, Copiloto…"
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Estilo de avatar</Label>
            <Select value={avatarStyle} onValueChange={setAvatarStyle}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AVATAR_STYLES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assistant-persona">Personalidad (opcional)</Label>
            <Textarea
              id="assistant-persona"
              name="persona"
              maxLength={500}
              defaultValue={initial.persona}
              rows={3}
              placeholder="Ej.: Motivador y directo, usa lenguaje sencillo y propone siempre el siguiente paso."
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar asistente"}
          </Button>
        </div>
      </form>
    </section>
  );
}
