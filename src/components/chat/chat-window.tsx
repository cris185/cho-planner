"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AssistantAvatar } from "@/components/assistant/assistant-avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatModelOption = { id: string; label: string };

function messageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function ChatWindow({
  assistantName,
  avatarStyle,
  avatarSeed,
  models,
  defaultModelId,
}: {
  assistantName: string;
  avatarStyle: string;
  avatarSeed: string;
  models: ChatModelOption[];
  defaultModelId?: string;
}) {
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState(defaultModelId ?? models[0]?.id ?? "");
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;

  const transportRef = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return { body: { messages, modelId: modelIdRef.current } };
      },
    }),
  );

  const { messages, sendMessage, status, error } = useChat({
    transport: transportRef.current,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";
  const hasModels = models.length > 0;

  function submit() {
    const text = input.trim();
    if (!text || busy || !hasModels) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col rounded-2xl border">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-2">
          <AssistantAvatar styleKey={avatarStyle} seed={avatarSeed} size={28} />
          <span className="font-semibold">{assistantName}</span>
        </div>
        {hasModels && (
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger size="sm" className="w-auto">
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
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {!hasModels ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            <p>
              Configura una API key en{" "}
              <Link href="/settings" className="text-primary hover:underline">
                Ajustes
              </Link>{" "}
              para chatear con tu asistente.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            <p>Pregúntale a {assistantName} cómo organizar tu día, descomponer un proyecto…</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {messageText(m)}
              </div>
            </div>
          ))
        )}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
              Escribiendo…
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-destructive">
            Ocurrió un error. Revisa tu API key e inténtalo de nuevo.
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 border-t p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={hasModels ? "Escribe un mensaje… (Enter para enviar)" : "Configura una API key primero"}
          disabled={!hasModels || busy}
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none"
        />
        <Button type="submit" size="icon" disabled={!hasModels || busy || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
