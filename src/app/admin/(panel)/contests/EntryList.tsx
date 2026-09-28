"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { deleteEntry, setEntryStatus, type EntryStatus } from "./actions";

export type EntryItem = {
  id: number;
  code: string;
  name: string;
  grade: number;
  letter: string | null;
  phone: string;
  teacher: string | null;
  note: string | null;
  status: string;
  date: string;
};

const statuses: { key: EntryStatus; label: string; tint: string }[] = [
  { key: "new", label: "Yangi", tint: "bg-blue-100 text-blue-800" },
  { key: "accepted", label: "Tasdiqlandi", tint: "bg-teal-100 text-teal-800" },
  { key: "declined", label: "Rad etildi", tint: "bg-slate-100 text-slate-700" },
];

export default function EntryList({ items }: { items: EntryItem[] }) {
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = items.filter((e) => !q || `${e.name} ${e.phone} ${e.code} ${e.teacher ?? ""}`.toLowerCase().includes(q));

  if (items.length === 0) {
    return <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali hech kim ro‘yxatdan o‘tmagan.</p>;
  }

  return (
    <>
      {items.length > 5 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, telefon, o‘qituvchi yoki kod…"
          className={`${inputClass} mb-3 mt-0 w-full sm:w-72`}
        />
      )}
      <ul className="space-y-2">
        {shown.map((e) => {
          const s = statuses.find((x) => x.key === e.status);
          return (
            <li key={e.id} className={`rounded-xl bg-white p-4 shadow-sm ${e.status === "new" ? "ring-1 ring-blue-200" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s?.tint ?? "bg-slate-100 text-slate-700"}`}>{s?.label ?? e.status}</span>
                <b className="text-[15px] text-slate-900">
                  {e.name} · {e.grade}
                  {e.letter ?? ""}-sinf
                </b>
                <a href={`tel:${e.phone.replace(/[^+\d]/g, "")}`} className="text-sm font-medium text-blue-700 hover:underline">
                  {e.phone}
                </a>
                <span className="ml-auto text-xs text-slate-500">{e.date}</span>
              </div>
              {(e.teacher || e.note) && (
                <p className="mt-1.5 text-sm text-slate-600">
                  {e.teacher && <span>O‘qituvchi: {e.teacher}</span>}
                  {e.teacher && e.note && " · "}
                  {e.note}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {statuses.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    disabled={pending || e.status === x.key}
                    onClick={() => start(() => setEntryStatus(e.id, x.key))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-40"
                  >
                    {x.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => confirm(`${e.name} — bu ariza o‘chirilsinmi?`) && start(() => deleteEntry(e.id))}
                  className="ml-auto text-sm text-red-700 hover:underline disabled:opacity-50"
                >
                  O‘chirish
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
