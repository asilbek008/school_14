"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { deleteReference, setReferenceNote, setReferenceStatus, type ReferenceStatus } from "./actions";

export type ReferenceItem = {
  id: number;
  code: string;
  kind: string;
  childName: string;
  grade: number | null;
  parentName: string;
  phone: string;
  purpose: string | null;
  note: string | null;
  adminNote: string | null;
  status: string;
  date: string;
  readyDate: string | null;
};

const statuses: { key: ReferenceStatus; label: string; tint: string }[] = [
  { key: "new", label: "Yangi", tint: "bg-blue-100 text-blue-800" },
  { key: "ready", label: "Tayyor", tint: "bg-amber-100 text-amber-800" },
  { key: "given", label: "Berildi", tint: "bg-teal-100 text-teal-800" },
  { key: "declined", label: "Rad etildi", tint: "bg-slate-100 text-slate-700" },
];

const kinds: Record<string, string> = {
  oquvchi: "O‘qiyotgani haqida",
  arxiv: "Arxiv (bitirgan)",
  boshqa: "Boshqa",
};

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Reference orders, newest first: the school works them from "Yangi" to "Berildi". */
export default function ReferenceList({ items }: { items: ReferenceItem[] }) {
  const [status, setStatus] = useState<ReferenceStatus | null>(items.some((r) => r.status === "new") ? "new" : null);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (r) => (!status || r.status === status) && (!q || `${r.childName} ${r.parentName} ${r.phone} ${r.code}`.toLowerCase().includes(q)),
  );
  const count = (key: ReferenceStatus) => items.filter((r) => r.status === key).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStatus(null)} className={chip(!status)}>
          Hammasi · {items.length}
        </button>
        {statuses.map((s) => {
          const n = count(s.key);
          return n ? (
            <button key={s.key} type="button" onClick={() => setStatus(s.key)} className={chip(status === s.key)}>
              {s.label} · {n}
            </button>
          ) : null;
        })}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, telefon yoki kod…"
          className={`${inputClass} ml-auto mt-0 w-full sm:w-64`}
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Bu bo‘limda buyurtma yo‘q.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const s = statuses.find((x) => x.key === r.status);
            return (
              <li key={r.id} className={`rounded-xl bg-white p-5 shadow-sm ${r.status === "new" ? "ring-1 ring-blue-200" : ""}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s?.tint ?? "bg-slate-100 text-slate-700"}`}>{s?.label ?? r.status}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-slate-700">{r.code}</span>
                  <span className="text-xs text-slate-500">{r.date}</span>
                  {r.readyDate && <span className="text-xs text-slate-500">· tayyor: {r.readyDate}</span>}
                </div>
                <b className="block text-[16px] text-slate-900">
                  {r.childName}
                  {r.grade ? ` · ${r.grade}-sinf` : ""}
                </b>
                <p className="text-sm text-slate-600">{kinds[r.kind] ?? r.kind}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold text-slate-500">Ota-ona: </dt>
                    <dd className="inline">{r.parentName}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-500">Telefon: </dt>
                    <dd className="inline">
                      <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-blue-700 hover:underline">
                        {r.phone}
                      </a>
                    </dd>
                  </div>
                  {r.purpose && (
                    <div className="sm:col-span-2">
                      <dt className="inline font-semibold text-slate-500">Qayerga kerak: </dt>
                      <dd className="inline">{r.purpose}</dd>
                    </div>
                  )}
                </dl>
                {r.note && <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{r.note}</p>}

                <form
                  action={(form) => start(() => setReferenceNote(r.id, String(form.get("admin_note") ?? "")))}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <input name="admin_note" defaultValue={r.adminNote ?? ""} maxLength={2000} placeholder="Ichki izoh (ota-onaga ko‘rinmaydi)" className={`${inputClass} mt-0 min-w-0 flex-1`} />
                  <button disabled={pending} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-40">
                    Izohni saqlash
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statuses.map((x) => (
                    <button
                      key={x.key}
                      type="button"
                      disabled={pending || r.status === x.key}
                      onClick={() => start(() => setReferenceStatus(r.id, x.key))}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-40"
                    >
                      {x.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm("Bu buyurtma butunlay o‘chirilsinmi?") && start(() => deleteReference(r.id))}
                    className="ml-auto text-sm text-red-700 hover:underline disabled:opacity-50"
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
