import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { credentialsSchema } from "@/lib/validation/auth";
import { prisma } from "@/server/db/client";

import { verifyPassword } from "./password";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? undefined,
          timezone: user.timezone,
          displayName: user.displayName,
          isDemo: user.isDemo,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      if (user?.id) {
        token.uid = user.id;
        token.tz = user.timezone;
        token.displayName = user.displayName ?? null;
        token.isDemo = user.isDemo ?? false;
      }
      // `unstable_update({ user: { timezone, name } })` after a profile change.
      if (trigger === "update" && session?.user) {
        if (typeof session.user.timezone === "string") {
          token.tz = session.user.timezone;
        }
        if ("displayName" in session.user) {
          token.displayName = session.user.displayName ?? null;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
        session.user.timezone =
          typeof token.tz === "string" ? token.tz : "Asia/Kolkata";
        session.user.displayName =
          typeof token.displayName === "string" ? token.displayName : null;
        session.user.isDemo = token.isDemo === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
