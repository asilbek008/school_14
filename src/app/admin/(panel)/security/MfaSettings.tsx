"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Enrolling = { factorId: string; qr: string; secret: string };

/** Authenticator app on/off: enroll (QR code + first code), or remove it. */
export default function MfaSettings() {
  const [state, setState] = useState<"loading" | "off" | "on">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback((factors: { id: string; status: string }[] | undefined) => {
    const verified = factors?.find((f) => f.status === "verified");
    setFactorId(verified?.id ?? null);
    setState(verified ? "on" : "off");
  }, []);
  const load = useCallback(async () => apply((await createClient().auth.mfa.listFactors()).data?.totp), [apply]);
  useEffect(() => {
    let alive = true;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => alive && apply(data?.totp));
    return () => {
      alive = false;
    };
  }, [apply]);

  async function start() {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    // Leftovers of an earlier, unfinished attempt.
    const { data: all } = await supabase.auth.mfa.listFactors();
    for (const f of all?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Telefon ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !data) return setMessage({ ok: false, text: `Boshlab bo‘lmadi: ${error?.message ?? ""}` });
    setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrolling.factorId, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) return setMessage({ ok: false, text: "Kod noto‘g‘ri. Ilovadagi hozirgi kodni kiriting." });
    setEnrolling(null);
    setCode("");
    setMessage({ ok: true, text: "Ikki bosqichli kirish yoqildi. Keyingi safar kirishda kod so‘raladi." });
    load();
  }

  async function turnOff() {
    if (!factorId || !window.confirm("Ikki bosqichli kirishni o‘chirasizmi? Hisob faqat parol bilan himoyalanadi.")) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId });
    setBusy(false);
    setMessage(error ? { ok: false, text: `O‘chirib bo‘lmadi: ${error.message}` } : { ok: true, text: "Ikki bosqichli kirish o‘chirildi." });
    load();
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      {message && <p className={`mb-4 rounded-lg p-3 text-sm ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{message.text}</p>}
      {state === "loading" ? (
        <p className="text-sm text-slate-500">Yuklanmoqda…</p>
      ) : state === "on" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-green-800">✓ Yoqilgan</p>
          <button type="button" onClick={turnOff} disabled={busy} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            O‘chirish
          </button>
        </div>
      ) : enrolling ? (
        <form onSubmit={verify} className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Telefoningizga <b>Google Authenticator</b> (yoki Microsoft Authenticator) ilovasini o‘rnating.</li>
            <li>Ilovada «+» → «QR kodni skanerlash» ni tanlab, quyidagi kodni skanerlang.</li>
            <li>Ilova ko‘rsatgan 6 xonali kodni pastga yozing.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- the QR code comes as an SVG data URL */}
          <img src={enrolling.qr} alt="QR kod" className="size-48 rounded-lg border border-slate-200 bg-white p-2" />
          <p className="text-xs text-slate-500">
            Skanerlab bo‘lmasa, kalitni qo‘lda kiriting: <code className="select-all break-all rounded bg-slate-100 px-1.5 py-0.5 font-mono">{enrolling.secret}</code>
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-slate-700">
              Kod
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-xl tracking-[0.3em]"
              />
            </label>
            <button disabled={busy || code.replace(/\s/g, "").length !== 6} className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              Tasdiqlash va yoqish
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-amber-800">O‘chirilgan</p>
          <button type="button" onClick={start} disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Yoqish
          </button>
        </div>
      )}
    </div>
  );
}
