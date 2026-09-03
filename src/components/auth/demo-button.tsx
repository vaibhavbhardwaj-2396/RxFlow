"use client";

import { Play } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AuthFormState } from "@/server/auth/actions";
import { demoLoginAction } from "@/server/auth/actions";

/**
 * "Try the demo" — signs into the shared, self-resetting demo account. Rendered
 * only when `NEXT_PUBLIC_DEMO_ENABLED` is set (public showcase deploys).
 */
export function DemoButton() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    () => demoLoginAction(),
    {},
  );

  if (process.env.NEXT_PUBLIC_DEMO_ENABLED !== "true") return null;

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <form action={formAction}>
        <DemoSubmit />
      </form>
      {state.error ? (
        <p role="alert" className="text-center text-xs text-danger">
          {state.error}
        </p>
      ) : (
        <p className="text-center text-xs text-ink-muted">
          Explore a filled-in account. It resets every night.
        </p>
      )}
    </div>
  );
}

function DemoSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonClass("secondary", "md"), "w-full")}
    >
      <Play className="size-4" aria-hidden />
      {pending ? "Loading the demo…" : "Try the demo"}
    </button>
  );
}
