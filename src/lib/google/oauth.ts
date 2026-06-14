import { google } from "googleapis";

// Scope mínimo: eventos de calendario + identidad básica para el id de cuenta.
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
];

export function baseUrl(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

export function redirectUri(): string {
  return `${baseUrl()}/api/google/callback`;
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // fuerza refresh_token
    scope: GOOGLE_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCode(code: string) {
  const { tokens } = await oauthClient().getToken(code);
  return tokens;
}

export async function getIdentity(idToken: string) {
  const ticket = await oauthClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return { sub: payload?.sub, email: payload?.email };
}

/** Cliente autenticado a partir del refresh token (ya descifrado). */
export function clientFromRefreshToken(refreshToken: string) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}
