"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/client";

type Pupil = { id: number; display_name: string; gender: "m" | "f" | null };

const tone = { m: "bg-brand-soft text-brand-deep", f: "bg-[#fae7e2] text-[#c9553f]", x: "bg-slate-100 text-slate-600" };

/**
 * The class's pupils under the parallel classes: counts, a boys/girls bar and, opened, the list — short names only ("Aliyev A.",
 * the owner's choice; full names stay in the admin panel). Read in the browser, so the cached page stays the same
 * and the names are not in its HTML.
 */
export default function ClassPupils({ classId, t }: { classId: number; t: Dictionary["timetable"]["pupils"] }) {
  const [data, setData] = useState<{ id: number; list: Pupil[] } | null>(null);

  useEffect(() => {
    createClient()
      .from("pupils")
      .select("id, display_name, gender")
      .eq("class_id", classId)
      .order("display_name")
      .then(({ data: rows }) => setData({ id: classId, list: (rows ?? []) as Pupil[] }));
  }, [classId]);

  const list = data?.id === classId ? data.list : null;
  if (list && !list.length) return null;

  const boys = list?.filter((p) => p.gender === "m").length ?? 0;
  const girls = list?.filter((p) => p.gender === "f").length ?? 0;

  // An accordion (owner's request): the summary shows the count and the boys/girls bar, the arrow opens the full list.
  return (
    <details className="acc group mt-5 rounded-2xl border border-slate-200 bg-white [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-3 p-5 sm:p-6">
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-slate-900">
            {t.title}
            {list && <span className="ml-2 rounded-full bg-navy px-2.5 py-0.5 align-middle text-sm font-bold text-white">{list.length}</span>}
          </span>
          <span className="mt-0.5 block text-[13px] text-slate-500 group-open:invisible">{list ? t.open : t.loading}</span>
        </span>
        {list && (
          <span className="order-last w-full sm:order-none sm:w-72">
            <span className="flex justify-between text-[13px] font-semibold">
              <span className="text-brand-deep">
                {boys} {t.boys}
              </span>
              <span className="text-[#c9553f]">
                {girls} {t.girls}
              </span>
            </span>
            <span className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <span className="bg-brand" style={{ width: `${(boys / list.length) * 100}%` }} />
              <span className="ml-auto bg-[#e0735c]" style={{ width: `${(girls / list.length) * 100}%` }} />
            </span>
          </span>
        )}
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep transition-transform duration-300 group-open:rotate-180 group-hover:bg-brand group-hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>

      {list && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <p className="mb-3 text-[13px] text-slate-500">{t.note}</p>
          <ol className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold ${tone[p.gender ?? "x"]}`}>
                  {p.display_name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-slate-900">{p.display_name}</span>
                  <span className="block text-[12px] text-slate-500">
                    {i + 1}
                    {p.gender && ` · ${p.gender === "m" ? t.boy : t.girl}`}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </details>
  );
}
