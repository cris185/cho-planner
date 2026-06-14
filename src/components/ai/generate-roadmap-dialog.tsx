"use client";

import { Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { weightColorVar } from "@/lib/validations/task";
import {
  createTasksFromRoadmap,
  generateRoadmapAction,
  type GenerateResult,
} from "@/server/actions/ai";
import type { Roadmap } from "@/lib/ai/schemas";

export type ModelOption = { id: string; label: string; provider: string };

export function GenerateRoadmapDialog({
  workspaceId,
  models,
  defaultModelId,
}: {
  workspaceId: string;
  models: ModelOption[];
  defaultModelId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [modelId, setModelId] = useState(defaultModelId ?? models[0]?.id ?? "");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [generating, startGenerate] = useTransition();
  const [creating, startCreate] = useTransition();

  const hasModels = models.length > 0;

  function reset() {
    setGoal("");
    setContext("");
    setRoadmap(null);
    setModelId(defaultModelId ?? models[0]?.id ?? "");
  }

  function handleGenerate() {
    if (!goal.trim()) {
      toast.error("Describe un objetivo.");
      return;
    }
    startGenerate(async () => {
      const res: GenerateResult = await generateRoadmapAction({
        workspaceId,
        goal,
        context,
        modelId,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.roadmap) setRoadmap(res.roadmap);
    });
  }

  function handleCreate() {
    if (!roadmap) return;
    startCreate(async () => {
      const res = await createTasksFromRoadmap(workspaceId, roadmap);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Tarea generada con IA creada");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="mr-1 h-4 w-4" /> Generar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar plan con IA</DialogTitle>
          <DialogDescription>
            Describe un objetivo y el asistente lo descompone en una tarea con subtareas.
          </DialogDescription>
        </DialogHeader>

        {!hasModels ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tienes ningún proveedor de IA configurado.{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Añade una API key en Ajustes
            </Link>
            .
          </div>
        ) : !roadmap ? (
          <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="ai-goal">Objetivo</Label>
              <Textarea
                id="ai-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ej.: Preparar el lanzamiento de la feature X / Plan de gimnasio para 4 semanas"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-context">Contexto (opcional)</Label>
              <Textarea
                id="ai-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Restricciones, nivel, plazos, recursos…"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto">
            <div>
              <p className="font-semibold">{roadmap.goal}</p>
              {roadmap.summary && (
                <p className="mt-1 text-sm text-muted-foreground">{roadmap.summary}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {roadmap.subtasks.length} subtareas
              </p>
              {roadmap.subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: weightColorVar(s.weight) }}
                  >
                    {s.weight}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{s.title}</span>
                  {s.estimatedMinutes ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ~{s.estimatedMinutes} min
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasModels && (
          <DialogFooter>
            {!roadmap ? (
              <Button onClick={handleGenerate} disabled={generating}>
                <Wand2 className="mr-1 h-4 w-4" />
                {generating ? "Generando…" : "Generar"}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setRoadmap(null)} disabled={creating}>
                  Volver
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Creando…" : "Crear tarea"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
