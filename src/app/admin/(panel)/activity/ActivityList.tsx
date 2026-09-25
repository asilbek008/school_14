"use client";

import { useState } from "react";
import Link from "next/link";
import { inputClass } from "@/components/admin/fields";

export type ActivityItem = {
  id: number;
  day: string;
  time: string;
  who: string;
  action: "insert" | "update" | "delete";
  section: string;
  label: string;
  href: string | null;
  changed: string[];
};

const verbs = {
  insert: { text: "qo‘shdi", tint: "bg-green-100 text-green-800" },
  update: { text: "o‘zgartirdi", tint: "bg-blue-100 text-blue-800" },
  delete: { text: "o‘chirdi", tint: "bg-red-100 text-red-800" },
};

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** The log, newest first and grouped by day, with filters by admin and section and a search. */
export default function ActivityList({ items }: { items: ActivityItem[] }) {
  const [who, setWho] = useState("");
  const [section, setSection] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const people = [...new Set(items.map((i) => i.who))];
  const sections = [...new Set(items.map((i) => i.section))].sort();
  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) => (!who || i.who === who) && (!section || i.section === section) && (!q || i.label.toLowerCase().includes(q)),
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
            placeholder="Nomi bo‘yicha qidirish…"
            aria-label="Qidirish"
            className={`${inputClass} mt-0 min-w-0 flex-1`}
          />
          {people.length > 1 && (
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Admin" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Barcha adminlar</option>
              {people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSection(null)} className={chip(!section)}>
            Hammasi · {items.length}
          </button>
          {sections.map((s) => (
            <button key={s} type="button" onClick={() => setSection(s)} className={chip(section === s)}>
              {s} · {items.filter((i) => i.section === s).length}
            </button>
          ))}
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
                    <li key={i.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
                      <span className="w-12 shrink-0 font-mono text-xs text-slate-500">{i.time}</span>
                      <span className="font-medium text-slate-800">{i.who}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${verbs[i.action].tint}`}>{verbs[i.action].text}</span>
                      <span className="text-slate-500">{i.section}:</span>
                      {i.href && i.action !== "delete" ? (
                        <Link href={i.href} className="min-w-0 font-medium text-blue-700 hover:underline">
                          {i.label}
                        </Link>
                      ) : (
                        <span className="min-w-0 font-medium text-slate-900">{i.label}</span>
                      )}
                      {i.changed.length > 0 && <span className="basis-full pl-15 text-xs text-slate-500">O‘zgargan: {i.changed.join(", ")}</span>}
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
