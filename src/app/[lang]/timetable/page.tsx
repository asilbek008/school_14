import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getClasses } from "@/lib/content";
import { shiftForGrade, shifts } from "@/lib/bells";
import { currentSchoolYear } from "@/lib/school";
import { byGrade, classLabel } from "@/lib/timetable";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/timetable">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.timetable };
}

// Grade bands, as in the design mockup: primary blue, middle teal, senior gold (top stripe and letter chips).
const band = (grade: number) =>
  grade <= 4
    ? { stripe: "before:bg-brand", chip: "bg-brand-soft text-brand-deep hover:bg-brand hover:text-white" }
    : grade <= 9
      ? { stripe: "before:bg-teal", chip: "bg-teal-soft text-[#0c6d62] hover:bg-teal hover:text-white" }
      : { stripe: "before:bg-gold", chip: "bg-gold-soft text-gold-deep hover:bg-gold hover:text-white" };
const shiftBadge = (id: number) => (id === 1 ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep");

/**
 * All grades at a glance (as in the design mockup): one card per grade with its shift and a chip
 * per class letter, which opens that class's timetable. Server-rendered, so the page stays cached.
 */
export default async function TimetablePage({ params }: PageProps<"/[lang]/timetable">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.timetable;
  const grades = byGrade(await getClasses());
  const [gradeBefore, gradeAfter] = t.grade.split("{n}");

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        title={dict.nav.timetable}
        intro={t.intro}
        kicker={fill(dict.topbar.year, currentSchoolYear())}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {grades.length ? (
          <>
            <div className="mb-6 flex flex-wrap gap-2.5">
              {shifts.map((shift) => (
                <span key={shift.id} className={`font-display rounded-full px-3 py-1.5 text-xs font-bold ${shiftBadge(shift.id)}`}>
                  {fill(t.shift, { n: shift.id, time: shift.start })} ({fill(t.gradesLine, { list: shift.grades.join(", ") })})
                </span>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-4">
              {grades.map(([grade, classes], i) => {
                const shift = shiftForGrade(grade);
                const b = band(grade);
                const count = plural(t.classes, classes.length, lang);
                return (
                  <section
                    key={grade}
                    id={`g${grade}`}
                    style={{ animationDelay: `${(i % 6) * 50}ms` }}
                    className={`reveal lift relative scroll-mt-28 overflow-hidden rounded-[14px] target:border-brand target:shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)] border border-slate-200 bg-white px-4 pb-4 pt-5 before:absolute before:inset-x-0 before:top-0 before:h-[3px] hover:border-slate-300 sm:px-5 ${b.stripe}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
                      <h2 className="font-display leading-none tracking-tight text-slate-900">
                        {gradeBefore && <span className="block text-xs font-semibold text-slate-500">{gradeBefore.trim()}</span>}
                        <b className="text-[28px] font-extrabold sm:text-[34px]">{grade}</b>
                        {gradeAfter && <sup className="text-xs font-semibold text-slate-500 sm:text-[13px]">{gradeAfter}</sup>}
                      </h2>
                      <span className="text-right text-[11.5px] font-semibold leading-tight text-slate-500">
                        <b className="font-display block text-lg text-slate-900">{classes.length}</b>
                        {count.replace(String(classes.length), "").trim()}
                      </span>
                    </div>
                    <span className={`font-display mb-3 inline-block rounded-full px-2.5 py-1 text-[11.5px] font-bold ${shiftBadge(shift.id)}`}>
                      {fill(t.shift, { n: shift.id, time: shift.start })}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {classes.map((c) => (
                        <Link
                          key={c.id}
                          href={`/${lang}/timetable/${c.id}`}
                          aria-label={classLabel(c)}
                          className={`press font-display grid h-9 min-w-9 place-items-center rounded-full px-3 text-[13px] font-bold transition-colors ${b.chip}`}
                        >
                          {c.letter}
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
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
