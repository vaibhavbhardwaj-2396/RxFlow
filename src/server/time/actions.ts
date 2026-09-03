"use server";

import { cookies } from "next/headers";

import { isProd } from "@/env";

import { SIM_COOKIE } from "./request-clock";

/**
 * Set or clear the development time-travel cookie. No-op in production.
 * `value` is a "YYYY-MM-DD" date or an ISO instant; `null` returns to real time.
 */
export async function setSimNow(value: string | null): Promise<void> {
  if (isProd) return;
  const jar = await cookies();
  if (!value) {
    jar.delete(SIM_COOKIE);
    return;
  }
  jar.set(SIM_COOKIE, value, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
  });
}
