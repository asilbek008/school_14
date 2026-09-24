"use client";

import { useState, useTransition } from "react";
import { inputClass } from "@/components/admin/fields";
import { deleteApplication, setApplicationNote, setApplicationStatus, type ApplicationStatus } from "./actions";

export type ApplicationItem = {
  id: number;
  childName: string;
  birth: string;
  grade: number;
  parentName: string;
  phone: string;
  address: string | null;
  previousSchool: string | null;
  note: string | null;
  adminNote: string | null;
  status: ApplicationStatus;
  date: string;
};

const statuses: { key: ApplicationStatus; label: string; tint: string }[] = [
  { key: "new", label: "Yangi", tint: "bg-blue-100 text-blue-800" },
  { key: "contacted", label: "Bog‘lanildi", tint: "bg-amber-100 text-amber-800" },
  { key: "accepted", label: "Qabul qilindi", tint: "bg-teal-100 text-teal-800" },
  { key: "declined", label: "Rad etildi", tint: "bg-slate-100 text-slate-700" },
];

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Admission applications, newest first: the school works them from "Yangi" to a decision. */
export default function ApplicationList({ items }: { items: ApplicationItem[] }) {
  const [status, setStatus] = useState<ApplicationStatus | null>(items.some((a) => a.status === "new") ? "new" : null);
  const [grade, setGrade] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (a) =>
      (!status || a.status === status) &&
      (!grade || a.grade === grade) &&
      (!q || `${a.childName} ${a.parentName} ${a.phone}`.toLowerCase().includes(q)),
  );
  const count = (key: ApplicationStatus) => items.filter((a) => a.status === key).length;
  const grades = [...new Set(items.map((a) => a.grade))].sort((a, b) => a - b);

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
          placeholder="Ism yoki telefon…"
          className={`${inputClass} ml-auto mt-0 w-full sm:w-64`}
        />
      </div>

      {grades.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setGrade(null)} className={chip(!grade)}>
            Barcha sinflar
          </button>
          {grades.map((g) => (
            <button key={g} type="button" onClick={() => setGrade(g)} className={chip(grade === g)}>
              {g}-sinf
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Bu bo‘limda ariza yo‘q.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => {
            const s = statuses.find((x) => x.key === a.status);
            return (
              <li key={a.id} className={`rounded-xl bg-white p-5 shadow-sm ${a.status === "new" ? "ring-1 ring-blue-200" : ""}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s?.tint ?? "bg-slate-100 text-slate-700"}`}>{s?.label ?? a.status}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{a.grade}-sinf</span>
                  <span className="text-xs text-slate-500">{a.date}</span>
                </div>
                <b className="block text-[16px] text-slate-900">{a.childName}</b>
                <p className="text-sm text-slate-600">Tug‘ilgan sanasi: {a.birth}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold text-slate-500">Ota-ona: </dt>
                    <dd className="inline">{a.parentName}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-500">Telefon: </dt>
                    <dd className="inline">
                      <a href={`tel:${a.phone.replace(/[^+\d]/g, "")}`} className="font-medium text-blue-700 hover:underline">
                        {a.phone}
                      </a>
                    </dd>
                  </div>
                  {a.address && (
                    <div>
                      <dt className="inline font-semibold text-slate-500">Manzil: </dt>
                      <dd className="inline">{a.address}</dd>
                    </div>
                  )}
                  {a.previousSchool && (
                    <div>
                      <dt className="inline font-semibold text-slate-500">Oldingi maktab: </dt>
                      <dd className="inline">{a.previousSchool}</dd>
                    </div>
                  )}
                </dl>
                {a.note && <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{a.note}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statuses.map((x) => (
                    <button
                      key={x.key}
                      type="button"
                      disabled={pending || a.status === x.key}
                      onClick={() => start(() => setApplicationStatus(a.id, x.key))}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-40"
                    >
                      {x.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm("Bu ariza butunlay o‘chirilsinmi?") && start(() => deleteApplication(a.id))}
                    className="ml-auto text-sm text-red-700 hover:underline disabled:opacity-50"
                  >
                    O‘chirish
                  </button>
                </div>

                <form
                  action={(form) => start(() => setApplicationNote(a.id, String(form.get("note") ?? "")))}
                  className="mt-3 flex flex-wrap items-end gap-2"
                >
                  <label className="min-w-0 flex-1 text-xs font-semibold text-slate-500">
                    Maktab izohi (faqat admin ko‘radi)
                    <input name="note" defaultValue={a.adminNote ?? ""} maxLength={2000} className={inputClass} />
                  </label>
                  <button disabled={pending} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 disabled:opacity-50">
                    Saqlash
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
