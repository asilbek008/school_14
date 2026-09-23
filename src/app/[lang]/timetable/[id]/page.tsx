import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getClasses, getClassTimetable, localized } from "@/lib/content";
import { fmtMinutes, lessons, shiftForGrade } from "@/lib/bells";
import { WEEKDAYS, classLabel } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ShiftBadge from "@/components/ShiftBadge";

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
  const times = lessons(shift);
  const parallel = allClasses.filter((c) => c.grade === cls.grade);
  const cell = (weekday: number, period: number) =>
    cls.lessons.find((l) => l.weekday === weekday && l.period === period) ?? null;

  return (
    <>
      <PageHeader title={classLabel(cls)} kicker={t.weekly} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href={`/${lang}/timetable`} className="text-sm font-bold text-brand link-grow">
          ← {t.back}
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

        {cls.lessons.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WEEKDAYS.map((day) => {
              // Show periods up to the day's last lesson; gaps before it stay visible as "—".
              const last = Math.max(0, ...cls.lessons.filter((l) => l.weekday === day).map((l) => l.period));
              return (
                <section key={day} className="reveal lift rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 text-lg font-bold">{t.days[day - 1]}</h2>
                  {last ? (
                    <ol className="divide-y divide-slate-100 text-sm">
                      {times.slice(0, last).map((time) => {
                        const lesson = cell(day, time.n);
                        const subject = lesson?.subjects;
                        return (
                          <li key={time.n} className="-mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-paper">
                            <span className="w-4 shrink-0 text-right font-bold text-slate-400">{time.n}</span>
                            <span className="w-24 shrink-0 tabular-nums text-slate-500">
                              {fmtMinutes(time.start)}–{fmtMinutes(time.end)}
                            </span>
                            <span className="min-w-0">
                              <span className={`block ${subject ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                                {subject ? localized(subject, "name", lang) : "—"}
                              </span>
                              {lesson?.teacher && <Teachers names={lesson.teacher} ids={cls.teacherIds} lang={lang} />}
                              {lesson?.alt && (
                                <>
                                  <span className="mt-1 block font-semibold text-slate-900">
                                    <span className="font-normal text-slate-400">/ </span>
                                    {localized(lesson.alt, "name", lang)}
                                  </span>
                                  {lesson.alt_teacher && <Teachers names={lesson.alt_teacher} ids={cls.teacherIds} lang={lang} />}
                                  <span className="mt-1 inline-block rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold-deep">
                                    {t.alternating}
                                  </span>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="text-sm text-slate-400">{t.noLessons}</p>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState>{t.notFilled}</EmptyState>
          </div>
        )}
      </div>
    </>
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
