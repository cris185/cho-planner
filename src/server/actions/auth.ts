"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { signIn } from "@/auth";
import { getDictionary } from "@/lib/i18n";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

const t = getDictionary();

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | undefined;

export async function registerUser(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t.auth.errorEmailExists };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      firstName,
      lastName: lastName ? lastName : null,
      email,
      passwordHash,
    },
  });

  // Inicia sesión automáticamente tras el registro.
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t.auth.errorSignupLogin };
    }
    throw error; // re-lanza el redirect de Next
  }
}

export async function authenticate(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t.auth.errorInvalidCredentials };
    }
    throw error; // re-lanza el redirect de Next
  }
}
