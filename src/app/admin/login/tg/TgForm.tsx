"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-2xl tracking-[0.4em] focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const errors: Record<string, string> = {
  rate_limited: "Juda ko‘p kod so‘raldi. 10 daqiqadan keyin qayta urinib ko‘ring.",
  not_linked: "Bu hisobga Telegram bot ulanmagan. Boshqa administratorga murojaat qiling.",
  no_bot: "Bot hozir ishlamayapti. Boshqa administratorga murojaat qiling.",
  bad_code: "Kod noto‘g‘ri. Botdagi oxirgi kodni kiriting.",
  expired: "Kodning muddati tugagan. Yangi kod oling.",
  too_many: "Kod bir necha marta xato kiritildi. Yangi kod oling.",
  no_session: "Sessiya topilmadi. Qaytadan kiring.",
};

/** Asks the bot for a code (once on load), then checks what the admin typed. */
export default function TgForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [left, setLeft] = useState(0);
  const router = useRouter();

  async function ask() {
    setError(null);
    setPending(true);
    const { data, error: rpcError } = await createClient().rpc("admin_tg_send_code");
    setPending(false);
    const code = (data as { error?: string } | null)?.error;
    if (rpcError || code) return setError(errors[code ?? ""] ?? "Kod yuborilmadi. Qaytadan urinib ko‘ring.");
    setNote("Kod Telegramga yuborildi.");
    setLeft(60);
  }

  // The code is asked for once, when the page opens (in a timeout, so the first render stays clean).
  useEffect(() => {
    const id = setTimeout(() => void ask(), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("admin_tg_verify", { p_code: code.replace(/\s/g, "") });
    const failed = (data as { error?: string } | null)?.error;
    if (rpcError || failed) {
      setPending(false);
      setCode("");
      return setError(errors[failed ?? ""] ?? "Kod tekshirilmadi. Qaytadan urinib ko‘ring.");
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
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : (
        note && <p className="text-sm text-emerald-700">{note}</p>
      )}
      <button
        type="submit"
        disabled={pending || code.replace(/\s/g, "").length !== 6}
        className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Tekshirilmoqda…" : "Tasdiqlash"}
      </button>
      <button
        type="button"
        onClick={ask}
        disabled={pending || left > 0}
        className="w-full text-sm text-slate-500 hover:text-slate-800 hover:underline disabled:no-underline disabled:opacity-60"
      >
        {left > 0 ? `Kodni qayta yuborish (${left})` : "Kodni qayta yuborish"}
      </button>
    </form>
  );
}
