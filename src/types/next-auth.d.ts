import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** IANA timezone — carried in the JWT so pages skip a DB lookup. */
      timezone: string;
      displayName: string | null;
      isDemo: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    timezone?: string;
    displayName?: string | null;
    isDemo?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    tz?: string;
    displayName?: string | null;
    isDemo?: boolean;
  }
}
