import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { baseUrl, exchangeCode, getIdentity, GOOGLE_SCOPES } from "@/lib/google/oauth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const url = new URL(req.url);
  const redirectTo = (status: string) =>
    NextResponse.redirect(new URL(`/settings?google=${status}`, baseUrl()));

  if (url.searchParams.get("error")) return redirectTo("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get("g_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return redirectTo("invalid_state");
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // Sin refresh token no podemos sincronizar en el futuro.
      return redirectTo("no_refresh");
    }

    const identity = tokens.id_token
      ? await getIdentity(tokens.id_token)
      : { sub: undefined };
    if (!identity.sub) return redirectTo("no_identity");

    const encryptedRefresh = encrypt(tokens.refresh_token);
    const scope = tokens.scope ?? GOOGLE_SCOPES.join(" ");

    await db.googleAccount.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        googleSub: identity.sub,
        encryptedRefresh,
        scope,
        calendarId: "primary",
      },
      update: { googleSub: identity.sub, encryptedRefresh, scope },
    });

    const res = redirectTo("connected");
    res.cookies.delete("g_oauth_state");
    return res;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return redirectTo("error");
  }
}
