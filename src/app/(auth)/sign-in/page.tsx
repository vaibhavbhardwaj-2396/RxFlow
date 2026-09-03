import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { DemoButton } from "@/components/auth/demo-button";
import { signInAction } from "@/server/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <AuthForm mode="sign-in" action={signInAction} />
      <DemoButton />
    </>
  );
}
