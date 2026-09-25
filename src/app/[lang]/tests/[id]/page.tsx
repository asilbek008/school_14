import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getTest, localized } from "@/lib/content";
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
        />
        {test.source && (
          <p className="mt-8 text-[13px] text-slate-500">
            {t.source}: {test.source}
          </p>
        )}
      </div>
    </>
  );
}
