"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { AuthFormState } from "@/server/auth/actions";

type Action = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  action: Action;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );
  const isSignUp = mode === "sign-up";

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      noValidate
    >
      <h1 className="font-display text-xl font-semibold text-ink">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>

      {isSignUp && (
        <TextField
          label="Name"
          name="displayName"
          autoComplete="name"
          placeholder="Your name"
          required
          error={state.fieldErrors?.displayName}
        />
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        required
        hint={isSignUp ? "At least 8 characters." : undefined}
        error={state.fieldErrors?.password}
      />

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <SubmitButton>{isSignUp ? "Create account" : "Sign in"}</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-accent">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to RxFlow?{" "}
            <Link href="/sign-up" className="font-medium text-accent">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass("primary", "lg")}
    >
      {pending ? "Just a moment…" : children}
    </button>
  );
}
