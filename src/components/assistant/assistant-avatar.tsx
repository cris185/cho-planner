"use client";

import { useMemo } from "react";

import { avatarDataUri } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function AssistantAvatar({
  styleKey,
  seed,
  size = 32,
  className,
}: {
  styleKey: string;
  seed: string;
  size?: number;
  className?: string;
}) {
  const uri = useMemo(() => avatarDataUri(styleKey, seed), [styleKey, seed]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt="Avatar del asistente"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full bg-muted", className)}
    />
  );
}
