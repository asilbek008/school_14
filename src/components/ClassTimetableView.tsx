"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, plural } from "@/i18n/fill";
import { fmtMinutes, lessons, shifts, tashkentNow } from "@/lib/bells";
import { WEEKDAYS } from "@/lib/timetable";

export type TimetableCell = {
  weekday: number;
  period: number;
  subject: string;
  teacher: string | null;
  /** Subject taught every other week in the same slot. */
  alt: string | null;
  altTeacher: string | null;
};

type Labels = Dictionary["timetable"];
type View = "daily" | "weekly";

/** Daily (one day as a timeline) and weekly (grid) views of one class's timetable. */
export default function ClassTimetableView({
  shiftId,
  cells,
  teacherIds,
  lang,
  t,
}: {
  shiftId: number;
  cells: TimetableCell[];
  teacherIds: Record<string, number>;
  lang: string;
  t: Labels;
}) {
  const times = lessons(shifts.find((s) => s.id === shiftId) ?? shifts[0]);
  const [view, setView] = useState<View>("daily");
  const [picked, setDay] = useState<number | null>(null);
  // "Now" is computed in the browser only: the page HTML is cached for everyone.
  const [now, setNow] = useState<ReturnType<typeof tashkentNow> | null>(null);

  useEffect(() => {
    const tick = () => setNow(tashkentNow());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const cell = (d: number, p: number) => cells.find((c) => c.weekday === d && c.period === p) ?? null;
  const lastPeriod = (d: number) => Math.max(0, ...cells.filter((c) => c.weekday === d).map((c) => c.period));
  const today = now && now.weekday >= 1 && now.weekday <= 6 ? now.weekday : null;
  const day = picked ?? today ?? 1;
  const isNow = (d: number, p: number) =>
    today === d && now != null && now.minutes >= times[p - 1].start && now.minutes < times[p - 1].end;
  const isPast = (d: number, p: number) => today === d && now != null && now.minutes >= times[p - 1].end;

  return (
    <div>
      <div role="tablist" aria-label={t.weekly} className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {(["daily", "weekly"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors duration-300 ${
              view === v ? "bg-navy text-white shadow" : "text-slate-600 hover:text-brand"
            }`}
          >
            {v === "daily" ? t.daily : t.weeklyTab}
          </button>
        ))}
      </div>

      {view === "daily" ? (
        <div key="daily" className="mt-6 animate-fade-in">
          <div className="grid grid-cols-6 gap-2" role="tablist" aria-label={t.daily}>
            {WEEKDAYS.map((d) => {
              const count = cells.filter((c) => c.weekday === d).length;
              const selected = d === day;
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={t.days[d - 1]}
                  onClick={() => setDay(d)}
                  className={`press relative flex flex-col items-center rounded-2xl border-2 px-1 py-3 transition-colors duration-300 ${
                    selected
                      ? "border-brand bg-brand text-white shadow-lg shadow-brand/25"
                      : "border-slate-200 bg-white text-slate-800 hover:border-brand hover:text-brand"
                  }`}
                >
                  <span className="text-base font-extrabold">{t.daysShort[d - 1]}</span>
                  <span className={`mt-0.5 text-xs font-semibold tabular-nums ${selected ? "text-white/75" : "text-slate-400"}`}>
                    {count}
                  </span>
                  {today === d && (
                    <span className="absolute -top-2 rounded-full bg-teal px-1.5 py-px text-[10px] font-bold text-white">{t.today}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">{t.days[day - 1]}</h2>
              <span className="text-sm font-semibold text-slate-500">
                {plural(t.lessonsCount, cells.filter((c) => c.weekday === day).length, lang)}
              </span>
            </div>
            {lastPeriod(day) ? (
              <ol key={day} className="relative mt-6 space-y-3 before:absolute before:bottom-6 before:left-[1.1rem] before:top-6 before:w-0.5 before:bg-slate-100">
                {times.slice(0, lastPeriod(day)).map((time) => {
                  const lesson = cell(day, time.n);
                  const current = isNow(day, time.n);
                  return (
                    <li
                      key={time.n}
                      className={`relative flex gap-4 animate-fade-up ${isPast(day, time.n) ? "opacity-55" : ""}`}
                      style={{ animationDelay: `${time.n * 40}ms` }}
                    >
                      <span
                        className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                          current ? "bg-teal text-white ring-4 ring-teal-soft" : lesson ? "bg-navy text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {time.n}
                      </span>
                      <div
                        className={`flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1 rounded-2xl px-4 py-3 transition-colors ${
                          current ? "bg-teal-soft ring-1 ring-teal/30" : "bg-paper hover:bg-brand-soft/60"
                        }`}
                      >
                        <div className="min-w-0">
                          {lesson ? (
                            <>
                              <p className="font-bold text-slate-900">{lesson.subject}</p>
                              {lesson.teacher && <Teachers names={lesson.teacher} ids={teacherIds} lang={lang} />}
                              {lesson.alt && (
                                <>
                                  <p className="mt-1.5 font-bold text-slate-900">
                                    <span className="font-normal text-slate-400">/ </span>
                                    {lesson.alt}
                                  </p>
                                  {lesson.altTeacher && <Teachers names={lesson.altTeacher} ids={teacherIds} lang={lang} />}
                                  <AltBadge label={t.alternating} />
                                </>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400">—</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {current && (
                            <span className="flex items-center gap-1.5 rounded-full bg-teal px-2 py-0.5 text-xs font-bold text-white">
                              <span className="size-1.5 animate-pulse rounded-full bg-white" />
                              {t.now}
                            </span>
                          )}
                          <span className="text-sm font-semibold tabular-nums text-slate-500">
                            {fmtMinutes(time.start)}–{fmtMinutes(time.end)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-slate-500">{t.noLessons}</p>
            )}
          </div>
        </div>
      ) : (
        <div key="weekly" className="mt-6 animate-fade-in overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 w-28 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.time}
                </th>
                {WEEKDAYS.map((d) => (
                  <th key={d} scope="col" className={`px-3 py-3 font-extrabold ${today === d ? "bg-brand-soft text-brand-deep" : "text-slate-900"}`}>
                    <span className="hidden lg:inline">{t.days[d - 1]}</span>
                    <span className="lg:hidden">{t.daysShort[d - 1]}</span>
                    {today === d && (
                      <span className="ml-2 rounded-full bg-teal px-1.5 py-px text-[10px] font-bold text-white">{t.today}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.slice(0, Math.max(...WEEKDAYS.map(lastPeriod))).map((time) => (
                <tr key={time.n} className="border-t border-slate-100">
                  <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 align-top font-normal shadow-[1px_0_0_var(--color-slate-100)]">
                    <span className="block font-extrabold text-slate-900">{fill(t.period, { n: time.n })}</span>
                    <span className="block text-xs tabular-nums text-slate-500">
                      {fmtMinutes(time.start)}–{fmtMinutes(time.end)}
                    </span>
                  </th>
                  {WEEKDAYS.map((d) => {
                    const lesson = cell(d, time.n);
                    const current = isNow(d, time.n);
                    return (
                      <td key={d} className={`px-2 py-2 align-top ${today === d ? "bg-brand-soft/40" : ""}`}>
                        {lesson ? (
                          <div
                            className={`h-full rounded-xl px-3 py-2 transition-colors ${
                              current ? "bg-teal-soft ring-2 ring-teal" : "hover:bg-paper"
                            }`}
                          >
                            <p className="font-bold leading-snug text-slate-900">{lesson.subject}</p>
                            {lesson.teacher && <Teachers names={lesson.teacher} ids={teacherIds} lang={lang} />}
                            {lesson.alt && (
                              <>
                                <p className="mt-1 font-bold leading-snug text-slate-900">
                                  <span className="font-normal text-slate-400">/ </span>
                                  {lesson.alt}
                                </p>
                                {lesson.altTeacher && <Teachers names={lesson.altTeacher} ids={teacherIds} lang={lang} />}
                                <AltBadge label={t.alternating} />
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="px-3 py-2 text-slate-300">—</p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AltBadge({ label }: { label: string }) {
  return (
    <span className="mt-1 inline-block rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold-deep">{label}</span>
  );
}

/** "A, B" — each name links to the teacher's profile when one is published. */
function Teachers({ names, ids, lang }: { names: string; ids: Record<string, number>; lang: string }) {
  return (
    <span className="block text-xs text-slate-500">
      {names.split(", ").map((name, i) => {
        const id = ids[name.toLowerCase()];
        return (
          <span key={name}>
            {i > 0 && ", "}
            {id ? (
              <Link href={`/${lang}/staff/${id}`} className="hover:text-brand hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        );
      })}
    </span>
  );
}
