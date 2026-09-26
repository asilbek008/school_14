import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getClasses, getClassTimetable, getTextbooks, localized, mediaUrl, textbookHref } from "@/lib/content";
import { fill } from "@/i18n/fill";
import { shiftForGrade } from "@/lib/bells";
import { classLabel } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ShiftBadge from "@/components/ShiftBadge";
import MyClassButton from "@/components/MyClassButton";
import ClassTimetableView, { type TimetableCell } from "@/components/ClassTimetableView";
import ClassBooks, { type ClassBook } from "@/components/ClassBooks";
import ClassPupils from "@/components/ClassPupils";

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
  const [cls, allClasses, library] = await Promise.all([getClassTimetable(Number((await params).id)), getClasses(), getTextbooks()]);
  if (!cls) notFound();

  // This grade's textbooks (general books after them) for the corner list; per subject, the grade's book opens from the lesson.
  const books: ClassBook[] = library
    .filter((b) => b.grade === cls.grade || b.grade == null)
    .sort((a, b) => (a.grade == null ? 1 : 0) - (b.grade == null ? 1 : 0))
    .flatMap((b) => {
      const file = textbookHref(b);
      if (!file) return [];
      return [
        {
          id: b.id,
          title: localized(b, "title", lang),
          subject: b.subjects ? localized(b.subjects, "name", lang) : null,
          subjectId: b.subjects?.id ?? null,
          cover: mediaUrl(b.cover),
          external: b.kind === "link",
          href: b.kind === "link" ? file : `/${lang}/library/${b.id}`,
        },
      ];
    });
  const bookFor = (subjectId: number | null) => (subjectId == null ? null : (books.find((b) => b.subjectId === subjectId && library.find((x) => x.id === b.id)?.grade === cls.grade)?.href ?? null));

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
            book: bookFor(l.subject_id),
            altBook: l.alt ? bookFor(l.alt_subject_id) : null,
          },
        ]
      : [],
  );
  const pickerHref = `/${lang}/timetable`;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }, { href: `/${lang}/timetable`, label: dict.nav.timetable }]} title={classLabel(cls)} kicker={dict.nav.timetable} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label={t.back} className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Link href={pickerHref} className="text-brand link-grow">
            {dict.nav.timetable}
          </Link>
          <span aria-hidden>›</span>
          <Link href={`${pickerHref}#s${shift.id}`} className="text-brand link-grow">
            {fill(t.shiftName, { n: shift.id })}
          </Link>
          <span aria-hidden>›</span>
          <Link href={`${pickerHref}#s${shift.id}-g${cls.grade}`} className="text-brand link-grow">
            {fill(t.grade, { n: cls.grade })}
          </Link>
          <span aria-hidden>›</span>
          <span className="text-slate-900" aria-current="page">
            {classLabel(cls)}
          </span>
        </nav>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <ShiftBadge shift={shift} label={t.shift} />
          <MyClassButton cls={{ id: cls.id, label: classLabel(cls), grade: cls.grade }} t={dict.myClass} />
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

        <ClassPupils classId={cls.id} t={t.pupils} />

        <div className="mt-8">
          {cells.length ? (
            <ClassTimetableView
              shiftId={shift.id}
              cells={cells}
              teacherIds={cls.teacherIds}
              lang={lang}
              t={t}
              corner={books.length > 0 && <ClassBooks books={books} grade={cls.grade} lang={lang} t={t} />}
            />
          ) : (
            <>
              {books.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <ClassBooks books={books} grade={cls.grade} lang={lang} t={t} />
                </div>
              )}
              <EmptyState>{t.notFilled}</EmptyState>
            </>
          )}
        </div>
      </div>
    </>
  );
}
