"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/cn";
import type { AuthFormState } from "@/server/auth/actions";
import { demoLoginAction } from "@/server/auth/actions";

type Variant = "solid" | "outline" | "ghost" | "inverse" | "inverse-ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-accent text-accent-ink hover:bg-accent-hover",
  outline: "border border-line bg-surface text-ink hover:bg-surface-sunken",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-sunken",
  inverse:
    "bg-[color:var(--canvas)] text-[color:var(--ink)] hover:bg-[color:var(--surface-sunken)]",
  "inverse-ghost":
    "border border-[color:var(--ink-muted)]/40 text-[color:var(--canvas)] hover:bg-white/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-12 px-6 text-base",
};

export function ctaClass(variant: Variant = "solid", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:opacity-60 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
  );
}

export function CtaLink({
  href,
  children,
  variant = "solid",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(ctaClass(variant, size), className)}>
      {children}
    </Link>
  );
}

/**
 * "Try the demo" — one-click sign-in to the self-resetting demo account. Falls
 * back to a "Create your plan" link when the demo isn't enabled on this deploy.
 */
export function TryDemoButton({
  demoEnabled,
  variant = "solid",
  size = "md",
  label = "Try the demo",
  className,
}: {
  demoEnabled: boolean;
  variant?: Variant;
  size?: Size;
  label?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    () => demoLoginAction(),
    {},
  );

  if (!demoEnabled) {
    return (
      <CtaLink
        href="/sign-up"
        variant={variant}
        size={size}
        className={className}
      >
        Create your plan
        <ArrowRight className="size-4" aria-hidden />
      </CtaLink>
    );
  }

  return (
    <form action={formAction} className={cn("inline-flex", className)}>
      <DemoSubmit variant={variant} size={size} label={label} />
      {state.error && (
        <span role="alert" className="sr-only">
          {state.error}
        </span>
      )}
    </form>
  );
}

function DemoSubmit({
  variant,
  size,
  label,
}: {
  variant: Variant;
  size: Size;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(ctaClass(variant, size), "w-full")}
    >
      <Play className="size-4" aria-hidden />
      {pending ? "Opening the demo…" : label}
    </button>
  );
}
