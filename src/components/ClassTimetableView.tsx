"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { plural } from "@/i18n/fill";
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
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors sm:px-5 sm:py-2 duration-300 ${
              view === v ? "bg-navy text-white shadow" : "text-slate-600 hover:text-brand"
            }`}
          >
            {v === "daily" ? t.daily : t.weeklyTab}
          </button>
        ))}
      </div>

      {view === "daily" ? (
        <div key="daily" className="mt-5 animate-fade-in sm:mt-6">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2" role="tablist" aria-label={t.daily}>
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
                  className={`press relative flex flex-col items-center rounded-xl border-2 px-1 py-2 transition-colors sm:rounded-2xl sm:py-3 duration-300 ${
                    selected
                      ? "border-brand bg-brand text-white shadow-lg shadow-brand/25"
                      : "border-slate-200 bg-white text-slate-800 hover:border-brand hover:text-brand"
                  }`}
                >
                  <span className="text-sm font-extrabold sm:text-base">{t.daysShort[d - 1]}</span>
                  <span className={`mt-0.5 text-[11px] font-semibold tabular-nums sm:text-xs ${selected ? "text-white/75" : "text-slate-400"}`}>
                    {count}
                  </span>
                  {today === d && (
                    <span className="absolute -top-2 rounded-full bg-teal px-1.5 py-px text-[10px] font-bold text-white">{t.today}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-6 sm:rounded-3xl sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t.days[day - 1]}</h2>
              <span className="text-sm font-semibold text-slate-500">
                {plural(t.lessonsCount, cells.filter((c) => c.weekday === day).length, lang)}
              </span>
            </div>
            {lastPeriod(day) ? (
              <ol key={day} className="relative mt-4 space-y-2 before:absolute before:bottom-6 before:left-[0.95rem] before:top-6 sm:mt-6 sm:space-y-3 sm:before:left-[1.1rem] before:w-0.5 before:bg-slate-100">
                {times.slice(0, lastPeriod(day)).map((time) => {
                  const lesson = cell(day, time.n);
                  const current = isNow(day, time.n);
                  return (
                    <li
                      key={time.n}
                      className={`relative flex gap-2.5 animate-fade-up sm:gap-4 ${isPast(day, time.n) ? "opacity-55" : ""}`}
                      style={{ animationDelay: `${time.n * 40}ms` }}
                    >
                      <span
                        className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold sm:size-9 sm:text-sm ${
                          current ? "bg-teal text-white ring-4 ring-teal-soft" : lesson ? "bg-navy text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {time.n}
                      </span>
                      <div
                        className={`flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-0.5 rounded-xl px-3 py-2 text-sm transition-colors sm:gap-x-4 sm:gap-y-1 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base ${
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
        // Weekly: one card per day (no wide table to scroll sideways); today is outlined.
        <div key="weekly" className="mt-5 grid animate-fade-in gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {WEEKDAYS.map((d) => {
            const count = cells.filter((c) => c.weekday === d).length;
            return (
              <section
                key={d}
                aria-label={t.days[d - 1]}
                className={`rounded-2xl border bg-white p-4 ${today === d ? "border-brand ring-2 ring-brand/20" : "border-slate-200"}`}
              >
                <header className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-extrabold text-slate-900">
                    {t.days[d - 1]}
                    {today === d && <span className="rounded-full bg-teal px-1.5 py-px text-[10px] font-bold text-white">{t.today}</span>}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">{plural(t.lessonsCount, count, lang)}</span>
                </header>
                {count ? (
                  <ol className="divide-y divide-slate-100">
                    {times.slice(0, lastPeriod(d)).map((time) => {
                      const lesson = cell(d, time.n);
                      const current = isNow(d, time.n);
                      return (
                        <li
                          key={time.n}
                          className={`-mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2 ${current ? "bg-teal-soft" : ""} ${isPast(d, time.n) ? "opacity-55" : ""}`}
                        >
                          <span
                            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                              current ? "bg-teal text-white" : lesson ? "bg-brand-soft text-brand-deep" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {time.n}
                          </span>
                          <div className="min-w-0 flex-1 text-sm">
                            {lesson ? (
                              <>
                                <p className="font-bold leading-snug text-slate-900">
                                  {lesson.subject}
                                  {lesson.alt && (
                                    <>
                                      <span className="font-normal text-slate-400"> / </span>
                                      {lesson.alt}
                                    </>
                                  )}
                                </p>
                                {lesson.teacher && <Teachers names={lesson.teacher} ids={teacherIds} lang={lang} />}
                                {lesson.alt && lesson.altTeacher && <Teachers names={lesson.altTeacher} ids={teacherIds} lang={lang} />}
                                {lesson.alt && <AltBadge label={t.alternating} />}
                              </>
                            ) : (
                              <p className="text-slate-400">—</p>
                            )}
                          </div>
                          <span className="shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-slate-500">
                            {fmtMinutes(time.start)}–{fmtMinutes(time.end)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="rounded-xl bg-paper px-3 py-4 text-center text-sm text-slate-500">{t.noLessons}</p>
                )}
              </section>
            );
          })}
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
