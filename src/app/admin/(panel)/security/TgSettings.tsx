"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type State = { linked: boolean; enabled: boolean; verified: boolean; bot: string | null };

/**
 * The Telegram step: the bot is linked with a one-time deep link (t.me/<bot>?start=admin_<token>) and afterwards
 * sends a six-digit code at every sign-in. The token stays in the database — the code is sent from there.
 */
export default function TgSettings() {
  const [state, setState] = useState<State | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient().rpc("admin_tg_state");
    if (data) setState(data as State);
    return data as State | null;
  }, []);

  useEffect(() => {
    createClient()
      .rpc("admin_tg_state")
      .then(({ data }) => data && setState(data as State));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** After the deep link is opened, wait for the bot to bind the chat. */
  function poll(tries = 40) {
    timer.current = setTimeout(async () => {
      const next = await load();
      if (next?.linked) {
        setWaiting(false);
        return setMessage({ ok: true, text: "Bot ulandi. Endi har kirishda kod Telegramga keladi." });
      }
      if (tries > 1) return poll(tries - 1);
      setWaiting(false);
      setMessage({ ok: false, text: "Bot javob bermadi. Havolani qaytadan oching va botda «Start» ni bosing." });
    }, 3000);
  }

  async function link() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await createClient().rpc("admin_tg_link");
    setBusy(false);
    if (error || !data || !state?.bot) return setMessage({ ok: false, text: "Havola olinmadi. Qaytadan urinib ko‘ring." });
    window.open(`https://t.me/${state.bot}?start=admin_${data as string}`, "_blank", "noopener");
    setWaiting(true);
    poll();
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await createClient().rpc("admin_tg_send_code");
    setBusy(false);
    const failed = (data as { error?: string } | null)?.error;
    setMessage(
      error || failed
        ? { ok: false, text: failed === "rate_limited" ? "Juda ko‘p kod so‘raldi, keyinroq urinib ko‘ring." : "Kod yuborilmadi." }
        : { ok: true, text: "Sinov kodi Telegramga yuborildi." },
    );
  }

  async function turnOff() {
    if (!window.confirm("Telegram kodini o‘chirasizmi? Kirishda faqat parol so‘raladi.")) return;
    setBusy(true);
    const { error } = await createClient().rpc("admin_tg_unlink");
    setBusy(false);
    setMessage(error ? { ok: false, text: "O‘chirib bo‘lmadi." } : { ok: true, text: "Telegram kodi o‘chirildi." });
    void load();
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-lg">✈️</span>
        <h2 className="font-semibold text-slate-900">Telegram kodi</h2>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">Tavsiya etiladi</span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Kirishda 6 xonali kod maktab botidan Telegramga keladi — alohida ilova o‘rnatish, QR skanerlash shart emas, telefon almashsa ham
        Telegramingiz o‘zingizda qoladi. Kod 5 daqiqa amal qiladi.
      </p>

      {message && <p className={`mb-4 rounded-lg p-3 text-sm ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{message.text}</p>}

      {!state ? (
        <p className="text-sm text-slate-500">Yuklanmoqda…</p>
      ) : !state.bot ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Avval bot ulanishi kerak:{" "}
          <Link href="/admin/parent-bot" className="font-semibold underline">
            Telegram bot sozlamalari
          </Link>
          .
        </p>
      ) : state.enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-green-800">✓ Yoqilgan</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={test} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Sinov kodi
            </button>
            <button type="button" onClick={turnOff} disabled={busy} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              O‘chirish
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-amber-800">{waiting ? "Botda «Start» ni bosishingiz kutilmoqda…" : "O‘chirilgan"}</p>
          <button type="button" onClick={link} disabled={busy || waiting} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            Botga ulash
          </button>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Telegramingizni yo‘qotsangiz, boshqa administrator «Jamoa» bo‘limidan ulanishni bekor qiladi.
      </p>
    </div>
  );
}
