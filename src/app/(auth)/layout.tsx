import { redirect } from "next/navigation";

import { auth } from "@/server/auth";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold text-ink">RxFlow</p>
          <p className="mt-1 text-sm text-ink-muted">
            Your prescription, turned into a living treatment plan.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
