"use server";

import { AuthError } from "next-auth";

import { demoEnabled } from "@/env";
import { credentialsSchema, registerSchema } from "@/lib/validation/auth";
import { signIn, signOut } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/server/seed/section30";
import { provisionUser } from "@/server/users/provision";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const GENERIC_SIGN_IN_ERROR = "That email and password don't match.";

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenIssues(parsed.error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // A successful sign-in throws a redirect, which must propagate.
    if (error instanceof AuthError) return { error: GENERIC_SIGN_IN_ERROR };
    throw error;
  }
  return {};
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenIssues(parsed.error) };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  await provisionUser({
    email: parsed.data.email,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error;
  }
  return {};
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}

/** One-click sign-in to the shared demo account (public showcase deploys). */
export async function demoLoginAction(): Promise<AuthFormState> {
  if (!demoEnabled) return { error: "The demo isn't available here." };
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "The demo account isn't set up yet." };
    }
    throw error;
  }
  return {};
}

function flattenIssues(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
