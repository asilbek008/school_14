import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getClasses } from "@/lib/content";
import { shiftForGrade } from "@/lib/bells";
import { byGrade } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ShiftBadge from "@/components/ShiftBadge";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/timetable">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.timetable };
}

export default async function TimetablePage({ params }: PageProps<"/[lang]/timetable">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.timetable;
  const grades = byGrade(await getClasses());

  return (
    <>
      <PageHeader title={dict.nav.timetable} intro={t.intro} kicker={dict.nav.school} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {grades.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grades.map(([grade, classes]) => (
              <li key={grade} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold tracking-tight">{fill(t.grade, { n: grade })}</h2>
                  <ShiftBadge shift={shiftForGrade(grade)} label={t.shift} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/${lang}/timetable/${c.id}`}
                      className="rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold text-brand-deep hover:bg-brand hover:text-white"
                    >
                      {c.grade}-{c.letter}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
        <p className="mt-8 text-sm">
          <Link href={`/${lang}/schedule`} className="font-bold text-brand hover:underline">
            {t.bells} →
          </Link>
        </p>
      </div>
    </>
  );
}
