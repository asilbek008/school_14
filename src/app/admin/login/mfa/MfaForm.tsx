"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function MfaForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === "verified");
    if (!factor) {
      setPending(false);
      return setError("Bu hisobda autentifikator ulanmagan.");
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.replace(/\s/g, "") });
    if (error) {
      setPending(false);
      setCode("");
      return setError("Kod noto‘g‘ri yoki eskirgan. Ilovadagi yangi kodni kiriting.");
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Kod
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          className={input}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || code.replace(/\s/g, "").length !== 6}
        className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Tekshirilmoqda…" : "Tasdiqlash"}
      </button>
    </form>
  );
}
