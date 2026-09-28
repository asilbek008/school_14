"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { deleteCertificate } from "./actions";

export type CertificateItem = {
  id: number;
  code: string;
  name: string;
  test: string;
  percent: number;
  correct: number;
  total: number;
  issued: string;
  created: string;
};

export default function CertificateList({ items }: { items: CertificateItem[] }) {
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = items.filter((c) => !q || `${c.name} ${c.test} ${c.code}`.toLowerCase().includes(q));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-700">Jami · {items.length}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, test yoki kod…"
          className={`${inputClass} ml-auto mt-0 w-full sm:w-64`}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[15px] text-slate-900">{c.name}</b>
                <p className="truncate text-sm text-slate-600">{c.test}</p>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold tracking-wider text-slate-700">{c.code}</span> · {c.percent}% ({c.correct}/{c.total}) · {c.issued}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`${c.name} — bu sertifikat yozuvi o‘chirilsinmi? Shundan keyin u «topilmadi» bo‘ladi.`) && start(() => deleteCertificate(c.id))}
                className="text-sm text-red-700 hover:underline disabled:opacity-50"
              >
                O‘chirish
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
