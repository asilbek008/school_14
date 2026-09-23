import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { getClasses } from "@/lib/content";
import { fmtMinutes, lessons, shiftForGrade, shifts } from "@/lib/bells";
import { byGrade, classLabel } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TimetablePicker, { type PickerShift } from "@/components/TimetablePicker";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/timetable">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.timetable };
}

export default async function TimetablePage({ params }: PageProps<"/[lang]/timetable">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.timetable;
  const grades = byGrade(await getClasses());
  const pickerShifts: PickerShift[] = shifts
    .map((shift) => ({
      id: shift.id,
      start: shift.start,
      end: fmtMinutes(lessons(shift).at(-1)!.end),
      grades: grades
        .filter(([grade]) => shiftForGrade(grade).id === shift.id)
        .map(([grade, classes]) => ({ grade, classes: classes.map((c) => ({ id: c.id, label: classLabel(c) })) })),
    }))
    .filter((shift) => shift.grades.length);

  return (
    <>
      <PageHeader title={dict.nav.timetable} intro={t.intro} kicker={dict.nav.school} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {pickerShifts.length ? <TimetablePicker shifts={pickerShifts} lang={lang} t={t} /> : <EmptyState>{t.empty}</EmptyState>}
        <p className="mt-10 text-sm">
          <Link href={`/${lang}/schedule`} className="group font-bold text-brand">
            {t.bells}{" "}
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </p>
      </div>
    </>
  );
}
