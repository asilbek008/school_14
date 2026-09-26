"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, plural } from "@/i18n/fill";
import { createClient } from "@/lib/supabase/client";

export type GraduateYear = {
  year: number;
  /** The confirmed count from the school year (null = not entered). */
  count: number | null;
  /** Names loaded for the year. */
  listed: number;
  /** The year still at school: the list is the current 11th grades. */
  live: boolean;
};

type Graduate = { id: number; name: string; gender: "m" | "f" | null; cls: string | null };

const tone = { m: "from-brand to-brand-deep", f: "from-[#e0735c] to-[#a63b28]", x: "from-slate-400 to-slate-500" };

/**
 * "Yillar bo‘yicha" on the alumni page (owner's request): a button per graduation year; the chosen year opens its list
 * below — counts, a boys/girls bar, class chips and the names (short form, like the class lists). Read in the browser.
 */
export default function GraduateYears({ years, t, lang }: { years: GraduateYear[]; t: Dictionary["alumni"]; lang: Locale }) {
  const [year, setYear] = useState<number | null>(null);
  const [data, setData] = useState<{ year: number; list: Graduate[] } | null>(null);
  const [cls, setCls] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const chosen = years.find((y) => y.year === year) ?? null;

  useEffect(() => {
    if (!chosen) return;
    const supabase = createClient();
    const done = (list: Graduate[]) => setData({ year: chosen.year, list });
    if (chosen.listed) {
      supabase
        .from("graduates")
        .select("id, display_name, gender, class_label")
        .eq("grad_year", chosen.year)
        .order("class_label")
        .order("display_name")
        .then(({ data: rows }) => done((rows ?? []).map((r) => ({ id: r.id, name: r.display_name, gender: r.gender as Graduate["gender"], cls: r.class_label }))));
    } else if (chosen.live) {
      supabase
        .from("pupils")
        .select("id, display_name, gender, school_classes!inner(grade, letter)")
        .eq("school_classes.grade", 11)
        .order("display_name")
        .then(({ data: rows }) =>
          done(
            ((rows ?? []) as unknown as { id: number; display_name: string; gender: Graduate["gender"]; school_classes: { letter: string } }[])
              .map((r) => ({ id: r.id, name: r.display_name, gender: r.gender, cls: `11-${r.school_classes.letter}` }))
              .sort((a, b) => (a.cls < b.cls ? -1 : a.cls > b.cls ? 1 : 0)),
          ),
        );
    } else done([]);
  }, [chosen]);

  useEffect(() => {
    if (year != null) panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [year]);

  const list = data && data.year === year ? data.list : null;
  const classes = list ? [...new Set(list.map((g) => g.cls).filter((c): c is string => !!c))] : [];
  const shown = list?.filter((g) => !cls || g.cls === cls) ?? [];
  const boys = list?.filter((g) => g.gender === "m").length ?? 0;
  const girls = list?.filter((g) => g.gender === "f").length ?? 0;
  const pick = (y: number) => {
    setYear(year === y ? null : y);
    setCls("");
  };

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {years.map((y) => {
          const on = y.year === year;
          const n = y.listed || y.count;
          return (
            <li key={y.year}>
              <button
                type="button"
                onClick={() => pick(y.year)}
                aria-expanded={on}
                aria-controls="graduate-list"
                className={`press group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-colors ${
                  on ? "border-navy bg-navy text-white shadow-lg" : "border-slate-200 bg-white hover:border-brand"
                }`}
              >
                <span className={`font-display text-[32px] font-extrabold leading-none tracking-tight ${on ? "text-gold" : "text-brand-deep"}`}>{y.year}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13.5px] font-semibold ${on ? "text-white" : "text-slate-800"}`}>{fill(t.yearLine, { y: y.year })}</span>
                  <span className={`block text-[12.5px] ${on ? "text-[#c7d0ea]" : "text-slate-500"}`}>
                    {n ? plural(t.people, n, lang) : t.noCount}
                    {y.live && ` · ${t.live}`}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-300 ${on ? "rotate-180 bg-white/15" : "bg-brand-soft text-brand-deep group-hover:bg-brand group-hover:text-white"}`}
                >
                  <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div ref={panel} id="graduate-list" className="scroll-mt-24">
        {chosen && (
          <div key={chosen.year} className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="chrome relative px-5 py-6 sm:px-7">
              <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">🎓 {t.byYearKicker}</p>
                  <h3 className="font-display mt-1 text-2xl font-extrabold text-white sm:text-[28px]">{fill(t.yearLine, { y: chosen.year })}</h3>
                  <p className="mt-1 text-[13.5px] text-[#c7d0ea]">
                    {list ? (list.length ? plural(t.people, list.length, lang) : t.noList) : t.loading}
                    {chosen.live && list?.length ? ` · ${t.liveNote}` : ""}
                  </p>
                </div>
                {list && list.length > 0 && (
                  <div className="w-full sm:w-72">
                    <div className="flex justify-between text-[13px] font-semibold">
                      <span className="text-[#9fb8ff]">
                        {boys} {t.boys}
                      </span>
                      <span className="text-[#f3a38f]">
                        {girls} {t.girls}
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                      <span className="bg-[#5b8cff]" style={{ width: `${(boys / list.length) * 100}%` }} />
                      <span className="ml-auto bg-[#e0735c]" style={{ width: `${(girls / list.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {list && list.length > 0 && (
              <div className="p-5 sm:p-7">
                {classes.length > 1 && (
                  <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t.classes}>
                    {["", ...classes].map((c) => (
                      <button
                        key={c || "all"}
                        type="button"
                        onClick={() => setCls(c)}
                        aria-pressed={cls === c}
                        className={`press rounded-full px-3.5 py-1.5 text-[13px] font-bold ${cls === c ? "bg-brand text-white" : "bg-brand-soft text-brand-deep hover:bg-brand hover:text-white"}`}
                      >
                        {c ? `${c} · ${list.filter((g) => g.cls === c).length}` : `${t.allClasses} · ${list.length}`}
                      </button>
                    ))}
                  </div>
                )}
                <ol className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {shown.map((g, i) => (
                    <li key={g.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[13px] font-bold text-white ${tone[g.gender ?? "x"]}`}>
                        {g.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] font-semibold text-slate-900">{g.name}</span>
                        <span className="block text-[12px] text-slate-500">
                          {i + 1}
                          {g.cls && ` · ${g.cls}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-[12.5px] text-slate-500">{t.note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
