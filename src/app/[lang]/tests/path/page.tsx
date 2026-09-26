import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getQuestionBank, getStudyNotes, localized } from "@/lib/content";
import { testSubjects } from "@/lib/tests";
import { topicKey } from "@/lib/topic-progress";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import LearningPath from "@/components/LearningPath";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/tests/path">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: `${dict.tests.path.kicker}: ${dict.tests.path.title}`, description: dict.tests.path.intro };
}

/** The learning path: the bank's topics per subject from easy to hard, with lessons; progress is kept in the browser. */
export default async function LearningPathPage({ params }: PageProps<"/[lang]/tests/path">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.tests;
  const [bank, notes] = await Promise.all([getQuestionBank(), getStudyNotes()]);
  const subjects = bank
    .filter((b) => b.topics.length > 0)
    .sort((a, b) => testSubjects.indexOf(a.subject as never) - testSubjects.indexOf(b.subject as never));
  const lessons = Object.fromEntries(notes.map((n) => [topicKey(n.subject, n.topic), localized(n, "body", lang)]));

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/tests`, label: dict.nav.tests },
        ]}
        kicker={t.path.kicker}
        title={t.path.title}
        intro={t.path.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {subjects.length ? (
          <LearningPath
            bank={subjects}
            notes={lessons}
            t={t.path}
            subjectsT={t.subjects}
            lang={lang}
            practiceHref={`/${lang}/tests/practice`}
            dtmHref={`/${lang}/tests/dtm`}
          />
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
