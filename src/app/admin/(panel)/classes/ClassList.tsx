"use client";

import { useState } from "react";
import Link from "next/link";
import { shifts } from "@/lib/bells";

export type ClassItem = {
  id: number;
  label: string;
  grade: number;
  shift: number;
  homeroom: string | null;
  lessons: number;
  students: number | null;
  /** Teacher names in the timetable that match no one's eMaktab name. */
  unlinked: string[];
  published: boolean;
};

const gaps = {
  empty: { label: "Jadvali bo‘sh", test: (c: ClassItem) => c.lessons === 0 },
  students: { label: "O‘quvchi soni kiritilmagan", test: (c: ClassItem) => c.students == null },
  homeroom: { label: "Sinf rahbarisiz", test: (c: ClassItem) => !c.homeroom },
  unlinked: { label: "Profilga bog‘lanmagan o‘qituvchi ismi bor", test: (c: ClassItem) => c.unlinked.length > 0 },
  hidden: { label: "Yashirin", test: (c: ClassItem) => !c.published },
};
type Gap = keyof typeof gaps;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Classes grouped by shift and grade, as small cards, with shift and missing-data filters. */
export default function ClassList({ items }: { items: ClassItem[] }) {
  const [shift, setShift] = useState<number | null>(null);
  const [gap, setGap] = useState<Gap | "">("");

  const shown = items.filter((c) => (!shift || c.shift === shift) && (!gap || gaps[gap].test(c)));
  const grades = [...new Set(shown.map((c) => c.grade))];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
        <button type="button" onClick={() => setShift(null)} className={chip(shift === null)}>
          Hammasi · {items.length}
        </button>
        {shifts.map((s) => (
          <button key={s.id} type="button" onClick={() => setShift(s.id)} className={chip(shift === s.id)}>
            {s.id}-smena ({s.start}) · {items.filter((c) => c.shift === s.id).length}
          </button>
        ))}
        <select
          value={gap}
          onChange={(e) => setGap(e.target.value as Gap | "")}
          aria-label="Kamchiliklar"
          className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Barcha sinflar</option>
          {(Object.keys(gaps) as Gap[]).map((k) => (
            <option key={k} value={k}>
              {gaps[k].label} · {items.filter(gaps[k].test).length}
            </option>
          ))}
        </select>
      </div>

      {grades.length ? (
        <div className="space-y-6">
          {grades.map((grade) => (
            <section key={grade}>
              <h2 className="mb-2 text-sm font-bold text-slate-600">
                {grade}-sinflar <span className="font-normal text-slate-400">· {shown.find((c) => c.grade === grade)!.shift}-smena</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shown
                  .filter((c) => c.grade === grade)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/classes/${c.id}`}
                        className="group flex h-full gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300"
                      >
                        <span className={`grid size-14 shrink-0 place-items-center rounded-lg text-lg font-bold ${c.shift === 1 ? "bg-blue-100 text-blue-800" : "bg-teal-100 text-teal-800"}`}>
                          {c.label}
                        </span>
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">
                            {c.homeroom ?? <span className="font-normal text-amber-700">Sinf rahbari tanlanmagan</span>}
                          </p>
                          <p className={c.lessons ? "text-slate-500" : "text-amber-700"}>{c.lessons ? `📅 ${c.lessons} ta dars` : "Jadval bo‘sh"}</p>
                          <p className={c.students != null ? "text-slate-500" : "text-amber-700"}>
                            {c.students != null ? `👥 ${c.students} ta o‘quvchi` : "O‘quvchi soni yo‘q"}
                          </p>
                          {c.unlinked.length > 0 && (
                            <p className="truncate text-amber-700" title={c.unlinked.join(", ")}>
                              Bog‘lanmagan: {c.unlinked.join(", ")}
                            </p>
                          )}
                          {!c.published && <p className="text-slate-500">Yashirin</p>}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech narsa topilmadi.</p>
      )}
    </div>
  );
}
