import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { getTextbooks } from "@/lib/content";
import { bookView } from "@/lib/library";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import LibraryBrowser from "@/components/LibraryBrowser";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/library">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.library.title, description: dict.library.intro };
}

/** The e-library: textbooks and study books as PDF, by grade and subject. */
export default async function LibraryPage({ params }: PageProps<"/[lang]/library">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.library;
  const books = (await getTextbooks()).map((b) => bookView(b, lang));

  const subjects = new Set(books.map((b) => b.subjectId).filter(Boolean)).size;
  const grades = new Set(books.map((b) => b.grade).filter(Boolean)).size;
  const pages = books.reduce((a, b) => a + (b.pages ?? 0), 0);
  const stats = [
    { value: books.length, label: plural(t.statBooks, books.length, lang) },
    { value: subjects, label: plural(t.statSubjects, subjects, lang) },
    { value: grades, label: plural(t.statGrades, grades, lang) },
    { value: pages, label: plural(t.statPages, pages, lang) },
  ];

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {books.length ? (
          <>
            <StatTiles stats={pages ? stats : stats.slice(0, 3)} />
            <LibraryBrowser books={books} lang={lang} t={t} allLabel={t.allGrades} />
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
