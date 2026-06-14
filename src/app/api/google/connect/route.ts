import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { baseUrl, getAuthUrl, isGoogleConfigured } from "@/lib/google/oauth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/settings?google=not_configured", baseUrl()));
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(getAuthUrl(state));
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
