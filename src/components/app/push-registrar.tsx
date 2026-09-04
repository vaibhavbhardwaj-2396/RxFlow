"use client";

import { useEffect } from "react";

import { BASE_PATH, withBase } from "@/lib/base-path";

/** Silently registers the service worker so Web Push can work once the user
 * opts in from Settings. No UI, no permission prompt here. */
export function PushRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register(withBase("/sw.js"), { scope: `${BASE_PATH}/` })
      .catch(() => {});
  }, []);

  return null;
}
