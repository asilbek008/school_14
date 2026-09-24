"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { deleteTrustMessage, markAllTrustRead, setTrustRead } from "./actions";

export type TrustItem = { id: number; topic: string; message: string; contact: string | null; read: boolean; date: string };

const topics: { key: string; label: string; tint: string }[] = [
  { key: "xavfsizlik", label: "Bola xavfsizligi", tint: "bg-red-100 text-red-800" },
  { key: "pul", label: "Pul yig‘ish", tint: "bg-amber-100 text-amber-800" },
  { key: "munosabat", label: "Xodim munosabati", tint: "bg-blue-100 text-blue-800" },
  { key: "taklif", label: "Taklif", tint: "bg-teal-100 text-teal-800" },
  { key: "boshqa", label: "Boshqa", tint: "bg-slate-100 text-slate-700" },
];
const topicOf = (key: string) => topics.find((t) => t.key === key);

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

const LONG = 280;

/** Trust-box messages, newest first. There is no sender to show: only the topic, the text and any contact given. */
export default function TrustList({ items }: { items: TrustItem[] }) {
  const unread = items.filter((m) => !m.read).length;
  const [tab, setTab] = useState<"new" | "read" | "all">(unread ? "new" : "all");
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const inTab = items.filter((m) => tab === "all" || m.read === (tab === "read"));
  const shown = inTab.filter((m) => (!topic || m.topic === topic) && (!q || m.message.toLowerCase().includes(q)));
  const count = (key: string) => inTab.filter((m) => m.topic === key).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["new", "read", "all"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={chip(tab === k)}>
            {k === "new" ? `Yangi · ${unread}` : k === "read" ? "O‘qilgan" : `Hammasi · ${items.length}`}
          </button>
        ))}
        {unread > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => markAllTrustRead())}
            className="ml-auto rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-50"
          >
            Hammasini o‘qildi deb belgilash
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTopic(null)} className={chip(!topic)}>
          Barcha mavzular
        </button>
        {topics.map((t) => {
          const n = count(t.key);
          return n ? (
            <button key={t.key} type="button" onClick={() => setTopic(t.key)} className={chip(topic === t.key)}>
              {t.label} · {n}
            </button>
          ) : null;
        })}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Matndan qidirish…"
          className={`${inputClass} ml-auto mt-0 w-full sm:w-64`}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Bu bo‘limda murojaat yo‘q.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => {
            const t = topicOf(m.topic);
            const long = m.message.length > LONG && !open.has(m.id);
            return (
              <li key={m.id} className={`rounded-xl bg-white p-5 shadow-sm ${m.read ? "" : "ring-1 ring-blue-200"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t?.tint ?? "bg-slate-100 text-slate-700"}`}>{t?.label ?? m.topic}</span>
                  {!m.read && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">Yangi</span>}
                  <span className="text-xs text-slate-500">{m.date}</span>
                </div>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
                  {long ? `${m.message.slice(0, LONG)}…` : m.message}
                </p>
                {long && (
                  <button type="button" onClick={() => setOpen(new Set(open).add(m.id))} className="mt-1 text-sm font-semibold text-blue-700 hover:underline">
                    To‘liq o‘qish
                  </button>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {m.contact ? (
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-800">📞 {m.contact}</span>
                  ) : (
                    <span className="text-slate-500">Anonim — javob berib bo‘lmaydi</span>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(() => setTrustRead(m.id, !m.read))}
                    className="ml-auto text-slate-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {m.read ? "O‘qilmagan deb belgilash" : "O‘qildi"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm("Bu murojaat butunlay o‘chirilsinmi?") && start(() => deleteTrustMessage(m.id))}
                    className="text-red-700 hover:underline disabled:opacity-50"
                  >
                    O‘chirish
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
