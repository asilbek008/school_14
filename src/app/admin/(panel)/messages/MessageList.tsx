"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { avatarGradient, initials } from "@/lib/positions";
import { deleteMessage, markAllRead, setMessageRead } from "./actions";

export type MessageItem = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  topic: string | null;
  message: string;
  read: boolean;
  date: string;
  createdAt: string;
};

const topics: { key: string; label: string; tint: string }[] = [
  { key: "savol", label: "Savol", tint: "bg-blue-100 text-blue-800" },
  { key: "taklif", label: "Taklif", tint: "bg-teal-100 text-teal-800" },
  { key: "murojaat", label: "Murojaat", tint: "bg-amber-100 text-amber-800" },
  { key: "boshqa", label: "Boshqa", tint: "bg-slate-100 text-slate-700" },
];
const topicOf = (key: string | null) => topics.find((t) => t.key === key);

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

// Long messages are shortened until opened.
const LONG = 280;

/** Contact messages, newest first, with new/read tabs, topic filter and search. */
export default function MessageList({ items }: { items: MessageItem[] }) {
  const unread = items.filter((m) => !m.read).length;
  const [tab, setTab] = useState<"new" | "read" | "all">(unread ? "new" : "all");
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const inTab = items.filter((m) => tab === "all" || m.read === (tab === "read"));
  const shown = inTab.filter(
    (m) => (!topic || m.topic === topic) && (!q || [m.name, m.email, m.phone, m.message].some((v) => v?.toLowerCase().includes(q))),
  );

  const tabs = [
    { key: "new", label: "Yangi", n: unread },
    { key: "read", label: "O‘qilgan", n: items.length - unread },
    { key: "all", label: "Hammasi", n: items.length },
  ] as const;

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${tab === t.key ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t.label} · {t.n}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, telefon, email yoki matn bo‘yicha qidirish…"
          aria-label="Qidirish"
          className={`${inputClass} mt-0`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setTopic(null)} className={chip(topic === null)}>
            Barcha mavzular
          </button>
          {topics.map((t) => (
            <button key={t.key} type="button" onClick={() => setTopic(t.key)} className={chip(topic === t.key)}>
              {t.label} · {inTab.filter((m) => m.topic === t.key).length}
            </button>
          ))}
          {unread > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => markAllRead())}
              className="ml-auto text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50"
            >
              Hammasini o‘qildi deb belgilash
            </button>
          )}
        </div>
      </div>

      {shown.length ? (
        <ul className="space-y-3">
          {shown.map((m) => {
            const t = topicOf(m.topic);
            const long = m.message.length > LONG && !open.has(m.id);
            return (
              <li key={m.id} className={`rounded-xl bg-white p-4 shadow-sm sm:p-5 ${m.read ? "" : "ring-2 ring-blue-200"}`}>
                <div className="flex items-start gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${avatarGradient(m.id)}`}>
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      {t && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.tint}`}>{t.label}</span>}
                      {!m.read && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">Yangi</span>}
                      <time dateTime={m.createdAt} className="ml-auto text-sm text-slate-500">
                        {m.date}
                      </time>
                    </div>
                    <p className={`mt-2 whitespace-pre-line text-slate-700 ${m.read ? "text-slate-600" : ""}`}>
                      {long ? `${m.message.slice(0, LONG).trimEnd()}…` : m.message}
                    </p>
                    {long && (
                      <button type="button" onClick={() => setOpen(new Set(open).add(m.id))} className="mt-1 text-sm font-semibold text-blue-700 hover:underline">
                        To‘liq o‘qish
                      </button>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      {m.phone && (
                        <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="rounded-lg bg-green-50 px-3 py-1.5 font-semibold text-green-800 hover:bg-green-100">
                          📞 {m.phone}
                        </a>
                      )}
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-800 hover:bg-blue-100">
                          ✉ {m.email}
                        </a>
                      )}
                      <span className="ml-auto flex gap-4">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => start(() => setMessageRead(m.id, !m.read))}
                          className="text-blue-700 hover:underline disabled:opacity-50"
                        >
                          {m.read ? "O‘qilmagan deb belgilash" : "O‘qildi ✓"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => confirm("Xabarni o‘chirasizmi?") && start(() => deleteMessage(m.id))}
                          className="text-red-700 hover:underline disabled:opacity-50"
                        >
                          O‘chirish
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
          {tab === "new" && !q && !topic ? "Yangi xabar yo‘q. Hammasi o‘qilgan ✓" : "Hech narsa topilmadi."}
        </p>
      )}
    </div>
  );
}
