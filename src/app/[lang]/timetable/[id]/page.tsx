import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getClasses, getClassTimetable, localized } from "@/lib/content";
import { shiftForGrade } from "@/lib/bells";
import { classLabel } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ShiftBadge from "@/components/ShiftBadge";
import ClassTimetableView, { type TimetableCell } from "@/components/ClassTimetableView";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/timetable/[id]">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  const cls = await getClassTimetable(Number((await params).id));
  if (!cls) return {};
  return { title: `${classLabel(cls)} · ${dict.nav.timetable}` };
}

export default async function ClassTimetablePage({ params }: PageProps<"/[lang]/timetable/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.timetable;
  const [cls, allClasses] = await Promise.all([getClassTimetable(Number((await params).id)), getClasses()]);
  if (!cls) notFound();

  const shift = shiftForGrade(cls.grade);
  const parallel = allClasses.filter((c) => c.grade === cls.grade);
  const cells: TimetableCell[] = cls.lessons.flatMap((l) =>
    l.subjects
      ? [
          {
            weekday: l.weekday,
            period: l.period,
            subject: localized(l.subjects, "name", lang),
            teacher: l.teacher,
            alt: l.alt ? localized(l.alt, "name", lang) : null,
            altTeacher: l.alt_teacher,
          },
        ]
      : [],
  );

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }, { href: `/${lang}/timetable`, label: dict.nav.timetable }]} title={classLabel(cls)} kicker={dict.nav.timetable} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Back to the grade's card on the all-classes page. */}
        <Link href={`/${lang}/timetable#g${cls.grade}`} className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand">
          <span aria-hidden className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
          {t.back}
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <ShiftBadge shift={shift} label={t.shift} />
          {cls.staff && (
            <span className="text-slate-600">
              {t.homeroom}:{" "}
              <Link href={`/${lang}/staff/${cls.staff.id}`} className="font-bold text-brand link-grow">
                {cls.staff.full_name}
              </Link>
            </span>
          )}
        </div>

        {parallel.length > 1 && (
          <nav aria-label={t.parallel} className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-slate-500">{t.parallel}:</span>
            {parallel.map((c) => (
              <Link
                key={c.id}
                href={`/${lang}/timetable/${c.id}`}
                aria-current={c.id === cls.id ? "page" : undefined}
                className={`press rounded-full px-3 py-1 font-bold ${
                  c.id === cls.id ? "bg-navy text-white" : "bg-brand-soft text-brand-deep hover:bg-brand hover:text-white"
                }`}
              >
                {classLabel(c)}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-8">
          {cells.length ? (
            <ClassTimetableView shiftId={shift.id} cells={cells} teacherIds={cls.teacherIds} lang={lang} t={t} />
          ) : (
            <EmptyState>{t.notFilled}</EmptyState>
          )}
        </div>
      </div>
    </>
  );
}
