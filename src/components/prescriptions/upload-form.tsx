"use client";

import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_MB = 10;

type Stage = "idle" | "uploading" | "encrypting" | "done" | "error";

const STAGE_TEXT: Record<Exclude<Stage, "idle" | "error">, string> = {
  uploading: "Uploading…",
  encrypting: "Encrypting & storing…",
  done: "Stored.",
};

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Keep the file under ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setStage("uploading");
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/prescriptions", { method: "POST", body });
      setStage("encrypting");
      const json = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!res.ok || !json?.id) {
        throw new Error(json?.error ?? "Upload failed.");
      }
      setStage("done");
      router.push(`/prescriptions/${json.id}`);
    } catch (e) {
      setStage("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  const busy =
    stage === "uploading" || stage === "encrypting" || stage === "done";

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center transition-colors hover:border-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        )}
      >
        <Upload className="size-6 text-ink-muted" aria-hidden />
        <span className="text-sm font-medium text-ink">
          {file ? file.name : "Choose a photo or PDF of your prescription"}
        </span>
        <span className="text-xs text-ink-muted">
          JPG, PNG, WebP or PDF · up to {MAX_MB} MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <p className="flex items-start gap-2 text-xs text-ink-muted">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-accent"
          aria-hidden
        />
        The file is encrypted at rest and only ever shown back to you through a
        signed-in link. It is a reference — you still enter the plan yourself.
      </p>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || busy}
        className={buttonClass("primary", "lg")}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {STAGE_TEXT[stage as keyof typeof STAGE_TEXT]}
          </>
        ) : (
          "Upload prescription"
        )}
      </button>
    </div>
  );
}
