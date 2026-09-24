"use client";

import { useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, plural } from "@/i18n/fill";

export type PickerShift = {
  id: number;
  start: string;
  end: string;
  grades: { grade: number; classes: { id: number; label: string }[] }[];
};

type Labels = Dictionary["timetable"];

/** Three steps: shift → grade → class. The choice lives in the URL hash (#s1-g5), so "back" from a class returns here. */
export default function TimetablePicker({ shifts, lang, t }: { shifts: PickerShift[]; lang: string; t: Labels }) {
  // The choice is the URL hash, read in the browser only (the page HTML is cached for everyone).
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const m = /^#s(\d)(?:-g(\d{1,2}))?$/.exec(hash);
  const shiftId = m ? Number(m[1]) : null;
  const grade = m?.[2] ? Number(m[2]) : null;
  const gradesRef = useRef<HTMLElement>(null);
  const classesRef = useRef<HTMLElement>(null);

  const choose = (next: string, scrollTo: HTMLElement | null) => {
    history.replaceState(null, "", next);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    requestAnimationFrame(() => scrollTo?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const shift = shifts.find((s) => s.id === shiftId) ?? null;
  const classes = shift?.grades.find((g) => g.grade === grade)?.classes ?? null;
  const step = classes ? 3 : shift ? 2 : 1;

  return (
    <div className="space-y-10">
      <ol className="flex items-center gap-2 text-sm font-bold sm:gap-3" aria-label={t.chooseClass}>
        {[t.stepShift, t.stepGrade, t.stepClass].map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={current ? "step" : undefined}>
              {i > 0 && <span className={`h-0.5 w-6 rounded-full sm:w-12 ${n <= step ? "bg-brand" : "bg-slate-200"}`} />}
              <span
                className={`grid size-8 place-items-center rounded-full transition-colors duration-300 ${
                  done ? "bg-brand text-white" : current ? "bg-navy text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={current ? "text-slate-900" : "text-slate-500"}>{label}</span>
            </li>
          );
        })}
      </ol>

      <section>
        <h2 className="mb-4 text-xl font-bold">{t.chooseShift}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {shifts.map((s) => {
            const selected = s.id === shiftId;
            const morning = s.id === 1;
            const count = s.grades.reduce((n, g) => n + g.classes.length, 0);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                onClick={() => choose(`#s${s.id}`, gradesRef.current)}
                className={`lift group relative overflow-hidden rounded-3xl border-2 p-6 text-left transition-colors duration-300 ${
                  selected
                    ? morning
                      ? "border-gold bg-gradient-to-br from-gold-soft to-white shadow-lg shadow-gold/20"
                      : "border-brand bg-gradient-to-br from-brand-soft to-white shadow-lg shadow-brand/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute -right-6 -top-6 size-28 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${
                    morning ? "bg-gold/30" : "bg-brand/25"
                  }`}
                />
                <span className="relative flex items-start justify-between gap-4">
                  <span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${morning ? "text-gold-deep" : "text-brand-deep"}`}>
                      {morning ? t.morning : t.afternoon}
                    </span>
                    <span className="mt-1 block text-2xl font-extrabold tracking-tight text-slate-900">
                      {fill(t.shiftName, { n: s.id })}
                    </span>
                  </span>
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-12 ${
                      morning ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"
                    }`}
                  >
                    {morning ? <SunIcon /> : <SunsetIcon />}
                  </span>
                </span>
                <span className="relative mt-5 block text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  {s.start} <span className="text-slate-300">–</span> {s.end}
                </span>
                <span className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span>{fill(t.gradesLine, { list: s.grades.map((g) => g.grade).join(", ") })}</span>
                  <span className="size-1 rounded-full bg-slate-300" />
                  <span className="font-semibold">{plural(t.classes, count, lang)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section ref={gradesRef} className="scroll-mt-24">
        {shift && (
          <div key={shift.id} className="animate-fade-up">
            <h2 className="mb-4 text-xl font-bold">{t.chooseGrade}</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {shift.grades.map((g) => {
                const selected = g.grade === grade;
                return (
                  <button
                    key={g.grade}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(`#s${shift.id}-g${g.grade}`, classesRef.current)}
                    className={`press flex flex-col items-center rounded-2xl border-2 px-2 py-4 transition-colors duration-300 ${
                      selected
                        ? "border-navy bg-navy text-white shadow-lg shadow-navy/25"
                        : "border-slate-200 bg-white text-slate-900 hover:border-brand hover:text-brand"
                    }`}
                  >
                    <span className="text-3xl font-extrabold leading-none tabular-nums">{g.grade}</span>
                    <span className={`mt-1.5 text-xs font-semibold ${selected ? "text-white/70" : "text-slate-500"}`}>
                      {plural(t.classes, g.classes.length, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section ref={classesRef} className="scroll-mt-24">
        {shift && classes && (
          <div key={`${shift.id}-${grade}`} className="animate-fade-up">
            <h2 className="mb-4 text-xl font-bold">{t.chooseClass}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/timetable/${c.id}`}
                  className="lift group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-brand hover:shadow-lg hover:shadow-brand/15"
                >
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand">{c.label}</span>
                  <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-deep transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function SunsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4" />
    </svg>
  );
}
