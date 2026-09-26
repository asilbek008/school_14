import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getQuestionBank } from "@/lib/content";
import { testSubjects } from "@/lib/tests";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import PracticePlayer from "@/components/PracticePlayer";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/tests/practice">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.tests.practice.title, description: dict.tests.practice.intro };
}

/** Practice from a subject's whole question bank; the page knows only the counts, the draw happens in the browser. */
export default async function PracticePage({ params }: PageProps<"/[lang]/tests/practice">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.tests;
  const bank = (await getQuestionBank()).sort((a, b) => testSubjects.indexOf(a.subject as never) - testSubjects.indexOf(b.subject as never));

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/tests`, label: dict.nav.tests },
        ]}
        kicker={t.practice.kicker}
        title={t.practice.title}
        intro={t.practice.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {bank.length ? <PracticePlayer bank={bank} t={t} lang={lang} href={`/${lang}/tests/practice`} backHref={`/${lang}/tests`} /> : <EmptyState>{t.empty}</EmptyState>}
        <p className="mt-10 text-center text-[12.5px] text-slate-500">🔒 {t.privacy}</p>
      </div>
    </>
  );
}
