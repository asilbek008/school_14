"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/fields";

export type LoginItem = {
  id: number;
  day: string;
  time: string;
  event: "login" | "failed" | "logout";
  email: string;
  reason: string | null;
  place: string | null;
  flag: string;
  ip: string | null;
  device: string | null;
  /** First sign-in of this admin from this device and country. */
  isNew: boolean;
};

const events = {
  login: { text: "Kirdi", tint: "bg-green-100 text-green-800" },
  failed: { text: "Noto‘g‘ri urinish", tint: "bg-red-100 text-red-800" },
  logout: { text: "Chiqdi", tint: "bg-slate-100 text-slate-700" },
};

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Sign-ins, failed attempts and sign-outs, newest first, grouped by day. */
export default function LoginList({ items }: { items: LoginItem[] }) {
  const [event, setEvent] = useState<LoginItem["event"] | null>(null);
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");

  const emails = [...new Set(items.map((i) => i.email))];
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) =>
      (!event || i.event === event) &&
      (!email || i.email === email) &&
      (!q || [i.place, i.ip, i.device, i.email].filter(Boolean).join(" ").toLowerCase().includes(q)),
  );
  const days = [...new Set(shown.map((i) => i.day))];

  return (
    <>
      <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Joy, IP yoki qurilma bo‘yicha qidirish…"
            aria-label="Qidirish"
            className={`${inputClass} mt-0 min-w-0 flex-1`}
          />
          {emails.length > 1 && (
            <select value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Barcha hisoblar</option>
              {emails.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEvent(null)} className={chip(!event)}>
            Hammasi · {items.length}
          </button>
          {(["login", "failed", "logout"] as const).map((k) => {
            const n = items.filter((i) => i.event === k).length;
            return n ? (
              <button key={k} type="button" onClick={() => setEvent(k)} className={chip(event === k)}>
                {events[k].text} · {n}
              </button>
            ) : null;
          })}
        </div>
      </div>

      {days.length ? (
        <div className="space-y-5">
          {days.map((d) => (
            <section key={d}>
              <h2 className="mb-2 text-sm font-bold text-slate-500">{d}</h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
                {shown
                  .filter((i) => i.day === d)
                  .map((i) => (
                    <li key={i.id} className={`px-4 py-3 text-sm ${i.event === "failed" ? "bg-red-50/40" : ""}`}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="w-12 shrink-0 font-mono text-xs text-slate-500">{i.time}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${events[i.event].tint}`}>{events[i.event].text}</span>
                        <span className="font-medium text-slate-900">{i.email || "—"}</span>
                        {i.isNew && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800" title="Bu hisob shu qurilma va davlatdan birinchi marta kirdi">
                            Yangi qurilma
                          </span>
                        )}
                        {i.reason && <span className="text-xs text-red-700">{i.reason}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-15 text-[13px] text-slate-600">
                        <span>
                          {i.flag} {i.place ?? "Joy aniqlanmadi"}
                        </span>
                        {i.device && <span>💻 {i.device}</span>}
                        {i.ip && <span className="font-mono text-xs text-slate-500">IP {i.ip}</span>}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      )}
    </>
  );
}
