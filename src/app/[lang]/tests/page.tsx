import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getQuestionBank, getTests, localized } from "@/lib/content";
import { isTestSubject, subjectColors, testSubjects, type TestSubject } from "@/lib/tests";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";
import TestHistory from "@/components/TestHistory";
import OfficialSamples from "@/components/OfficialSamples";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/tests">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.tests.title, description: dict.tests.intro };
}

const subjectOf = (v: string): TestSubject => (isTestSubject(v) ? v : "boshqa");

/** Tests by subject (filter chips and search), the DTM mock exam card and the pupil's own recent results. */
export default async function TestsPage({ params }: PageProps<"/[lang]/tests">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.tests;
  const [tests, bank] = await Promise.all([getTests(), getQuestionBank()]);
  const bankSubjects = bank.sort((a, b) => testSubjects.indexOf(a.subject as TestSubject) - testSubjects.indexOf(b.subject as TestSubject));

  const questions = tests.reduce((a, x) => a + x.questions, 0);
  const subjects = testSubjects.filter((s) => tests.some((x) => subjectOf(x.subject) === s));
  const dtmQuestions = tests.filter((x) => x.kind === "dtm").reduce((a, x) => a + x.questions, 0);
  const stats = [
    { value: tests.length, label: plural(t.statTests, tests.length, lang) },
    { value: questions, label: plural(t.statQuestions, questions, lang) },
    { value: subjects.length, label: plural(t.statSubjects, subjects.length, lang) },
    { value: dtmQuestions, label: plural(t.statDtm, dtmQuestions, lang) },
  ];
  const options = subjects.map((s) => ({ value: s, label: `${t.subjects[s]} · ${tests.filter((x) => subjectOf(x.subject) === s).length}` }));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <TestHistory lang={lang} t={t} />
        {tests.length ? (
          <>
            <StatTiles stats={stats} />
            <div className="mb-10 grid gap-4 lg:grid-cols-2">
              <div className="reveal chrome flex flex-col justify-between gap-5 rounded-2xl p-6 sm:p-7">
                <div className="relative flex items-start gap-4">
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold text-2xl">
                    🎓
                  </span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gold">{t.dtmCard.kicker}</p>
                    <h2 className="text-xl font-bold">{t.dtmCard.title}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-300">{t.dtmCard.text}</p>
                  </div>
                </div>
                <Link
                  href={`/${lang}/tests/dtm`}
                  className="press group relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-gold px-6 py-3 font-bold text-[#241703] shadow-lg shadow-gold/30 hover:bg-[#eba53c]"
                >
                  {t.dtmCard.button}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
              <div className="reveal flex flex-col justify-between gap-5 rounded-2xl border border-brand/25 bg-brand-soft p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-2xl">
                    📚
                  </span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-brand-deep">{t.practice.kicker}</p>
                    <h2 className="text-xl font-bold text-slate-900">{t.practice.title}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{t.practice.text}</p>
                  </div>
                </div>
                <Link
                  href={`/${lang}/tests/practice`}
                  className="press group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/25 hover:bg-brand-deep"
                >
                  {t.practice.button}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
            {bankSubjects.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">{t.practice.bankTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{fill(t.practice.bankText, { n: bankSubjects.reduce((a, b) => a + b.total, 0), s: bankSubjects.length })}</p>
                <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {bankSubjects.map((b) => {
                    const subject = subjectOf(b.subject);
                    return (
                      <li key={b.subject}>
                        <Link
                          href={`/${lang}/tests/practice#${b.subject}`}
                          className="lift relative block overflow-hidden rounded-xl border border-slate-200 bg-white px-3.5 pb-3 pt-4 hover:border-slate-300"
                        >
                          <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${subjectColors[subject].tile}`} />
                          <b className="block truncate text-[14px] text-slate-900">{t.subjects[subject]}</b>
                          <span className="text-[12.5px] text-slate-500">
                            {plural(t.questions, b.total, lang)} · {fill(t.practice.topics, { n: b.topics.length })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            <CategoryFilter allLabel={`${dict.common.all} · ${tests.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tests.map((x, i) => {
                  const subject = subjectOf(x.subject);
                  const title = localized(x, "title", lang);
                  const description = localized(x, "description", lang);
                  return (
                    <li key={x.id} data-cat={subject} data-q={`${title} ${t.subjects[subject]}`.toLowerCase()} style={{ animationDelay: `${(i % 6) * 60}ms` }} className="reveal">
                      <Link
                        href={`/${lang}/tests/${x.id}`}
                        className="lift group flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white hover:border-slate-300"
                      >
                        <span className={`h-1.5 bg-gradient-to-r ${subjectColors[subject].tile}`} />
                        <span className="flex flex-1 flex-col p-5">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${subjectColors[subject].badge}`}>{t.subjects[subject]}</span>
                            {x.kind === "dtm" && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11.5px] font-bold text-gold-deep">{t.kinds.dtm}</span>}
                            {x.grade && <span className="text-[12px] font-medium text-slate-500">{fill(t.grade, { n: x.grade })}</span>}
                          </span>
                          <b className="font-display mt-2 block text-[16.5px] leading-snug tracking-tight text-slate-900">{title}</b>
                          {description && <span className="mt-1 line-clamp-2 text-[13.5px] text-slate-600">{description}</span>}
                          <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px] text-slate-500">
                            <span>
                              {plural(t.questions, x.questions, lang)} · {x.time_limit ? fill(t.minutes, { n: x.time_limit }) : t.noLimit}
                            </span>
                            <span aria-hidden className="grid size-8 place-items-center rounded-full bg-slate-100 font-bold text-slate-700 transition group-hover:translate-x-0.5 group-hover:bg-brand group-hover:text-white">
                              →
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CategoryFilter>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
        <OfficialSamples t={t} />
        <p className="mt-8 text-center text-[12.5px] text-slate-500">🔒 {t.privacy}</p>
      </div>
    </>
  );
}
