"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** The rules the Edge Function checks again, so what the page shows is what actually applies. */
const rules = [
  { label: "Kamida 10 ta belgi", test: (p: string) => p.length >= 10 },
  { label: "Kamida 1 ta bosh harf (A–Z)", test: (p: string) => /\p{Lu}/u.test(p) },
  { label: "Kamida 1 ta raqam (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "Kamida 1 ta belgi (_ @ ! …)", test: (p: string) => /[^\p{L}\p{N}]/u.test(p) },
];

const problems: Record<string, string> = {
  unknown: "Bu havola yaroqsiz. Administratordan yangi havola so‘rang.",
  used: "Bu havoladan allaqachon foydalanilgan. Parolni unutgan bo‘lsangiz, administratorga murojaat qiling.",
  expired: "Havolaning muddati tugagan. Administratordan yangisini so‘rang.",
  weak: "Parol talablarga javob bermayapti.",
  exists: "Bu email bilan hisob allaqachon bor.",
  failed: "Hisob yaratilmadi. Keyinroq urinib ko‘ring.",
};

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/staff-invite`;
const headers = { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" };

/** Who the link is for, the password rules, and the account it creates. */
export default function InviteSetup({ token }: { token: string }) {
  const [state, setState] = useState<{ email?: string; error?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ token }) });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; email?: string; error?: string };
        setState(data.ok ? { email: data.email } : { error: problems[data.error ?? ""] ?? problems.unknown });
      } catch {
        setState({ error: "Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring." });
      }
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  const passed = rules.map((rule) => rule.test(password));
  const ready = passed.every(Boolean) && password === again;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ token, password }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; email?: string; error?: string };
      if (!data.ok) {
        setBusy(false);
        return setError(problems[data.error ?? ""] ?? problems.failed);
      }
      // The account exists now: sign in with it and go straight to the panel.
      const { error: signInError } = await createClient().auth.signInWithPassword({ email: data.email!, password });
      if (signInError) {
        setBusy(false);
        return setError("Hisob ochildi. Endi parolingiz bilan kiring.");
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setBusy(false);
      setError("Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.");
    }
  }

  if (!state) return <p className="text-center text-sm text-slate-500">Yuklanmoqda…</p>;
  if (state.error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-800">
        {state.error}
        <p className="mt-3">
          <Link href="/admin/login" className="font-semibold underline">
            Kirish sahifasi
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-700">
        Hisob: <b className="break-all">{state.email}</b>
      </p>

      <label className="block text-sm font-medium text-slate-700">
        Yangi parol
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
          required
          className={input}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Parolni takrorlang
        <input
          type={show ? "text" : "password"}
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          autoComplete="new-password"
          required
          className={input}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4" />
        Parolni ko‘rsatish
      </label>

      <ul className="space-y-1 text-sm">
        {rules.map((rule, i) => (
          <li key={rule.label} className={passed[i] ? "text-green-700" : "text-slate-500"}>
            {passed[i] ? "✓" : "○"} {rule.label}
          </li>
        ))}
        <li className={password && password === again ? "text-green-700" : "text-slate-500"}>
          {password && password === again ? "✓" : "○"} Ikkala parol bir xil
        </li>
      </ul>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!ready || busy}
        className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {busy ? "Hisob ochilmoqda…" : "Parolni saqlash va kirish"}
      </button>
    </form>
  );
}
