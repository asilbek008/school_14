"use client";

import { useState } from "react";
import AdminForm from "@/components/admin/AdminForm";

export type StudentsClass = { id: number; label: string; grade: number; students: number | null };

/** One number per class, grouped by grade, with running totals per grade and for the school. */
export default function StudentsForm({ classes, action, confirmed }: { classes: StudentsClass[]; action: Parameters<typeof AdminForm>[0]["action"]; confirmed: number }) {
  const [values, setValues] = useState<Record<number, string>>(() => Object.fromEntries(classes.map((c) => [c.id, c.students == null ? "" : String(c.students)])));
  const num = (id: number) => (values[id] === "" ? 0 : Number(values[id]) || 0);
  const total = classes.reduce((a, c) => a + num(c.id), 0);
  const filled = classes.filter((c) => values[c.id] !== "").length;
  const grades = [...new Set(classes.map((c) => c.grade))];

  return (
    <AdminForm action={action}>
      <div className="sticky top-14 z-10 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-slate-100 bg-white/95 px-6 py-3 backdrop-blur md:top-0">
        <p className="font-semibold text-slate-900">
          Jami: <span className="text-blue-700">{total}</span> ta o‘quvchi
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({filled} / {classes.length} sinf kiritilgan)
          </span>
        </p>
        <p className={`text-sm ${filled === classes.length && total !== confirmed ? "text-amber-700" : "text-slate-500"}`}>
          Tasdiqlangan umumiy son: {confirmed}
          {filled === classes.length && total !== confirmed && ` — farq ${total - confirmed > 0 ? "+" : ""}${total - confirmed}`}
        </p>
      </div>
      <div className="space-y-5">
        {grades.map((grade) => {
          const list = classes.filter((c) => c.grade === grade);
          return (
            <fieldset key={grade}>
              <legend className="mb-2 text-sm font-bold text-slate-700">
                {grade}-sinflar <span className="font-normal text-slate-400">· {list.reduce((a, c) => a + num(c.id), 0)} ta</span>
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6">
                {list.map((c) => (
                  <label key={c.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2 focus-within:border-blue-500 sm:gap-2 sm:px-3">
                    <span className="w-10 shrink-0 text-sm font-bold text-slate-800 sm:w-12 sm:text-base">{c.label}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      name={`students_${c.id}`}
                      min={0}
                      max={60}
                      value={values[c.id]}
                      onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                      placeholder="—"
                      aria-label={`${c.label} sinf o‘quvchilari`}
                      className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-right tabular-nums focus:border-blue-600 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
    </AdminForm>
  );
}
