"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/fill";
import { fmtMinutes, lessons, shiftForGrade, shiftStatus, tashkentNow } from "@/lib/bells";
import { myClassSnapshot, parseMyClass, setMyClass, subscribeMyClass } from "@/lib/my-class";
import { createClient } from "@/lib/supabase/client";

type Labels = {
  title: string;
  today: string;
  tomorrow: string;
  dayLessons: string;
  none: string;
  open: string;
  change: string;
  prompt: string;
  pick: string;
  now: string;
};
type Name = { name_uz: string; name_ru: string | null; name_en: string | null };
type Row = { period: number; subject: string; alt: string | null };

const nameIn = (s: Name | null, lang: Locale) => (s ? (lang === "uz" ? s.name_uz : s[`name_${lang}`] || s.name_uz) : null);

/** Which school day to show: today until the shift's last lesson ends, then the next one (Sunday is off). */
function dayToShow(grade: number) {
  const now = tashkentNow();
  const last = lessons(shiftForGrade(grade)).at(-1)!.end;
  if (now.weekday !== 0 && now.minutes < last) return { weekday: now.weekday, when: "today" as const, now };
  const next = now.weekday === 6 ? 1 : now.weekday === 0 ? 1 : now.weekday + 1;
  // Saturday evening → Monday is not "tomorrow".
  return { weekday: next, when: now.weekday === 6 ? ("later" as const) : ("tomorrow" as const), now };
}

/**
 * Home page card for the visitor's own class (chosen on its timetable page, kept in this browser):
 * the lessons of today, or of the next school day once today's are over. Read in the browser, so the
 * cached home page stays the same for everyone.
 */
export default function MyClassCard({ lang, t, days }: { lang: Locale; t: Labels; days: string[] }) {
  const raw = useSyncExternalStore(subscribeMyClass, myClassSnapshot, () => null);
  const cls = parseMyClass(raw);
  const [data, setData] = useState<{ key: string; rows: Row[] } | null>(null);
  const day = cls ? dayToShow(cls.grade) : null;
  const key = cls && day ? `${cls.id}-${day.weekday}` : "";

  useEffect(() => {
    if (!cls || !day) return;
    const supabase = createClient();
    supabase
      .from("lessons")
      .select("period, subjects!lessons_subject_id_fkey(name_uz, name_ru, name_en), alt:subjects!lessons_alt_subject_id_fkey(name_uz, name_ru, name_en)")
      .eq("class_id", cls.id)
      .eq("weekday", day.weekday)
      .order("period")
      .then(({ data: rows }) => {
        const list = (rows ?? []) as unknown as { period: number; subjects: Name | null; alt: Name | null }[];
        setData({
          key,
          rows: list.flatMap((r) => (r.subjects ? [{ period: r.period, subject: nameIn(r.subjects, lang)!, alt: nameIn(r.alt, lang) }] : [])),
        });
      });
    // key covers the class and the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang]);

  if (raw === null) return null;
  const timetable = `/${lang}/timetable`;

  if (!cls || !day) {
    return (
      <div className="reveal flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4">
        <p className="flex items-center gap-3 text-sm text-slate-600">
          <Star className="size-5 shrink-0 text-gold-deep" />
          {t.prompt}
        </p>
        <Link href={timetable} className="press rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-brand">
          {t.pick} →
        </Link>
      </div>
    );
  }

  const shift = shiftForGrade(cls.grade);
  const times = lessons(shift);
  const status = day.when === "today" ? shiftStatus(shift, day.now.weekday, day.now.minutes) : null;
  const current = status?.kind === "lesson" ? status.n : null;
  const heading = day.when === "today" ? t.today : day.when === "tomorrow" ? t.tomorrow : fill(t.dayLessons, { day: days[day.weekday - 1] });
  const rows = data?.key === key ? data.rows : null;

  return (
    <section className="reveal rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-[16.5px] font-bold text-slate-900">
          <Star className="size-5 text-gold-deep" filled />
          {t.title} · {cls.label}
          <span className="font-sans text-sm font-semibold text-slate-500">— {heading}</span>
        </h3>
        <div className="flex gap-3 text-sm font-bold">
          <Link href={`${timetable}/${cls.id}`} className="text-brand link-grow">
            {t.open} →
          </Link>
          <Link href={timetable} onClick={() => setMyClass(null)} className="text-slate-500 hover:text-brand">
            {t.change}
          </Link>
        </div>
      </div>
      {rows === null ? (
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-paper" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t.none}</p>
      ) : (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const time = times[r.period - 1];
            const now = r.period === current;
            return (
              <li
                key={r.period}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${now ? "bg-brand text-white" : "bg-paper text-slate-900"}`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${now ? "bg-white/20" : "bg-white text-slate-700"}`}>
                  {r.period}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm font-bold">
                    {r.subject}
                    {r.alt && ` / ${r.alt}`}
                  </b>
                  <small className={`block text-xs ${now ? "text-white/85" : "text-slate-500"}`}>
                    {time ? `${fmtMinutes(time.start)}–${fmtMinutes(time.end)}` : ""}
                    {now && ` · ${t.now}`}
                  </small>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Star({ className, filled = false }: { className: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}
