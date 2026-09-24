"use client";

import { useState } from "react";
import Link from "next/link";
import Status from "@/components/admin/Status";
import { inputClass } from "@/components/admin/fields";
import type { EventCategory } from "@/lib/categories";

export type EventItem = {
  id: number;
  title: string;
  category: EventCategory;
  day: string;
  month: string;
  date: string;
  time: string;
  location: string | null;
  upcoming: boolean;
  telegram: boolean;
  published: boolean;
};

const categories: { key: EventCategory; label: string; tint: string }[] = [
  { key: "bayram", label: "Bayram", tint: "bg-amber-100 text-amber-800" },
  { key: "maktab", label: "Maktab tadbiri", tint: "bg-blue-100 text-blue-800" },
  { key: "olimpiada", label: "Olimpiada", tint: "bg-teal-100 text-teal-800" },
  { key: "sport", label: "Sport", tint: "bg-rose-100 text-rose-800" },
];
const catOf = Object.fromEntries(categories.map((c) => [c.key, c])) as Record<EventCategory, (typeof categories)[number]>;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Events split into upcoming (soonest first) and past (latest first), with search and category filters. */
export default function EventList({ items }: { items: EventItem[] }) {
  const upcomingCount = items.filter((e) => e.upcoming).length;
  const [when, setWhen] = useState<"upcoming" | "past" | "all">(upcomingCount ? "upcoming" : "all");
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const inWhen = items.filter((e) => when === "all" || e.upcoming === (when === "upcoming"));
  const shown = inWhen.filter(
    (e) => (!category || e.category === category) && (!q || e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)),
  );
  // Upcoming reads best soonest first; the server sends latest first.
  if (when === "upcoming") shown.reverse();

  const tabs = [
    { key: "upcoming", label: "Yaqinlashayotgan", n: upcomingCount },
    { key: "past", label: "O‘tgan", n: items.length - upcomingCount },
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
              onClick={() => setWhen(t.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${when === t.key ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t.label} · {t.n}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nomi yoki joyi bo‘yicha qidirish…"
          aria-label="Qidirish"
          className={`${inputClass} mt-0`}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory(null)} className={chip(category === null)}>
            Barcha turkumlar
          </button>
          {categories.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={chip(category === c.key)}>
              {c.label} · {inWhen.filter((e) => e.category === c.key).length}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <ul className="space-y-2.5">
          {shown.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/events/${e.id}`}
                className={`group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 sm:gap-4 ${e.upcoming ? "" : "opacity-80"}`}
              >
                <span className={`grid size-14 shrink-0 place-content-center rounded-lg text-center leading-none sm:size-16 ${catOf[e.category].tint}`}>
                  <b className="text-xl sm:text-2xl">{e.day}</b>
                  <span className="mt-1 text-xs font-semibold uppercase">{e.month}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{e.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${catOf[e.category].tint}`}>{catOf[e.category].label}</span>
                    <span>{e.date}</span>
                    <span>🕒 {e.time}</span>
                    {e.location && <span>📍 {e.location}</span>}
                    {e.telegram && <span className="text-sky-700">✈ Telegram</span>}
                  </p>
                </div>
                <Status published={e.published} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      )}
    </div>
  );
}
