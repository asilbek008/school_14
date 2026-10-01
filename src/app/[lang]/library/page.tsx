import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getTextbooks } from "@/lib/content";
import { bookView } from "@/lib/library";
import PageHeader from "@/components/PageHeader";
import SectionHead from "@/components/SectionHead";
import { tileColors } from "@/components/StatTiles";
import { school } from "@/lib/school";
import { fill, plural } from "@/i18n/fill";
import StatTiles from "@/components/StatTiles";
import LibraryShelves from "@/components/LibraryShelves";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/library">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.library.title, description: dict.library.intro };
}

/** The e-library: textbooks and study books as PDF, by grade and subject. */
export default async function LibraryPage({ params }: PageProps<"/[lang]/library">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.library;
  const all = (await getTextbooks()).map((b) => bookView(b, lang));
  // Two shelves: the textbooks a lesson needs, and the literature to read for the year.
  const books = all.filter((b) => b.section === "darslik");
  const reading = all.filter((b) => b.section === "mutolaa");

  const subjects = new Set(books.map((b) => b.subjectId).filter(Boolean)).size;
  const grades = new Set(all.map((b) => b.grade).filter(Boolean)).size;
  const pages = books.reduce((a, b) => a + (b.pages ?? 0), 0);
  const stats = [
    { value: all.length, label: plural(t.statBooks, all.length, lang) },
    { value: subjects, label: plural(t.statSubjects, subjects, lang) },
    { value: grades, label: plural(t.statGrades, grades, lang) },
    { value: pages, label: plural(t.statPages, pages, lang) },
  ];

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {all.length > 0 && <StatTiles stats={pages ? stats : stats.slice(0, 3)} />}
        {/* Two shelves, chosen rather than stacked: the textbooks a lesson needs, and the year's
            literature read on the publisher's own site. */}
        {all.length > 0 && <LibraryShelves books={books} reading={reading} lang={lang} t={t} />}

        {/* Every grade's full set of textbooks on the external catalogue (linked, not copied). */}
        <section className={all.length ? "mt-12 border-t border-slate-200 pt-10" : ""}>
          <SectionHead kicker={school.textbookCatalog.name} title={t.catalogTitle} desc={t.catalogText} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g, i) => (
              <li key={g}>
                <a
                  href={school.textbookCatalog.url(g)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`reveal lift group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white ${tileColors[i % tileColors.length]}`}
                >
                  <span className="font-display text-4xl font-extrabold leading-none">{g}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px]">{fill(t.catalogGrade, { n: g })}</b>
                    <span className="block text-[12.5px] opacity-90">{t.catalogBooks}</span>
                  </span>
                  <span aria-hidden className="text-lg font-bold opacity-80 transition-transform duration-300 group-hover:translate-x-1">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-slate-500">{fill(t.catalogNote, { site: school.textbookCatalog.name })}</p>
        </section>
      </div>
    </>
  );
}
