import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getClasses, getTest, getTestLeaderboard, localized } from "@/lib/content";
import { classLabel } from "@/lib/timetable";
import { isTestSubject, subjectColors } from "@/lib/tests";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import TestPlayer from "@/components/TestPlayer";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/tests/[id]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const test = await getTest(Number((await params).id));
  return { title: test ? localized(test, "title", lang) : dict.tests.title };
}

/** One test: what it is, then the player (practice or exam). The questions come without their answers. */
export default async function TestPage({ params }: PageProps<"/[lang]/tests/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.tests;
  const test = await getTest(Number((await params).id));
  if (!test || !test.items.length) notFound();

  const [classes, standings] = await Promise.all([getClasses(), getTestLeaderboard(test.id)]);
  const labels = new Map(classes.map((c) => [c.id, classLabel(c)]));
  const board = standings.filter((s) => labels.has(s.classId)).slice(0, 15);
  const title = localized(test, "title", lang);
  const description = localized(test, "description", lang);
  const subject = isTestSubject(test.subject) ? test.subject : "boshqa";
  const facts = [
    t.subjects[subject],
    plural(t.questions, test.questions, lang),
    test.time_limit ? fill(t.minutes, { n: test.time_limit }) : t.noLimit,
    test.grade && fill(t.grade, { n: test.grade }),
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/tests`, label: dict.nav.tests },
        ]}
        kicker={test.kind === "dtm" ? `${t.subjects[subject]} · ${t.kinds.dtm}` : t.subjects[subject]}
        title={title}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {facts.map((f, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${i === 0 ? subjectColors[subject].badge : "bg-slate-100 text-slate-700"}`}>
              {f}
            </span>
          ))}
        </div>
        {description && (
          <div className="mb-6 max-w-3xl text-slate-700">
            <RichText text={description} />
          </div>
        )}
        <TestPlayer
          testId={test.id}
          title={title}
          href={`/${lang}/tests/${test.id}`}
          backHref={`/${lang}/tests`}
          sections={[{ label: title, subject, points: 1, questions: test.items }]}
          minutes={test.time_limit}
          t={t}
          leaderboard={{ testId: test.id, classes: classes.map((c) => ({ id: c.id, label: classLabel(c) })) }}
        />
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">🏆 {t.board.title}</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">{t.board.intro}</p>
          {board.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-[14.5px]">
                <thead className="bg-slate-50 text-[12px] font-bold text-slate-500">
                  <tr>
                    <th scope="col" className="w-12 px-4 py-3 text-center">#</th>
                    <th scope="col" className="px-4 py-3">{t.board.class}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.board.average}</th>
                    <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">{t.board.best}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.board.attempts}</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((s, i) => (
                    <tr key={s.classId} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-center text-lg">{["🥇", "🥈", "🥉"][i] ?? <span className="text-sm font-bold text-slate-500">{i + 1}</span>}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{labels.get(s.classId)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                            <span className="block h-full rounded-full bg-gradient-to-r from-brand to-teal" style={{ width: `${s.average}%` }} />
                          </span>
                          <b className="tabular-nums text-slate-900">{s.average}%</b>
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">{s.best}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{s.results}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">{t.board.empty}</p>
          )}
        </section>
        {test.source && (
          <p className="mt-8 text-[13px] text-slate-500">
            {t.source}: {test.source}
          </p>
        )}
      </div>
    </>
  );
}
