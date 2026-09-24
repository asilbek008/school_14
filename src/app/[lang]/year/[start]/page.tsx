import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getAlbums, getEvents, getNews, getSchoolYears, localized } from "@/lib/content";
import { currentSchoolYear, school } from "@/lib/school";
import { schoolYearOf, yearLabel } from "@/lib/school-years";
import PageHeader from "@/components/PageHeader";
import StatTiles from "@/components/StatTiles";
import SectionHead from "@/components/SectionHead";
import RichText from "@/components/RichText";
import EmptyState from "@/components/EmptyState";
import NewsCard from "@/components/NewsCard";
import EventItem from "@/components/EventItem";
import AlbumCard from "@/components/AlbumCard";
import SetSiteYear from "@/components/SetSiteYear";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getSchoolYears()).map((y) => ({ start: String(y.start_year) }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/year/[start]">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  const start = Number((await params).start);
  return { title: fill(dict.year.title, { y: yearLabel(start) }) };
}

/**
 * One school year (from the header's year switcher): the admin's numbers and summary, then the news,
 * events and albums dated in it (1 September – 31 August).
 */
export default async function YearPage({ params }: PageProps<"/[lang]/year/[start]">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.year;
  const start = Number((await params).start);
  const current = currentSchoolYear().from;
  const years = await getSchoolYears();
  const row = years.find((y) => y.start_year === start);
  if (!row && start !== current) notFound();

  const [allNews, { upcoming, past }, allAlbums] = await Promise.all([getNews(), getEvents(), getAlbums()]);
  const news = allNews.filter((n) => n.published_at && schoolYearOf(n.published_at) === start);
  const events = [...past.slice().reverse(), ...upcoming].filter((e) => schoolYearOf(e.starts_at) === start);
  const albums = allAlbums.filter((a) => a.event_date && schoolYearOf(a.event_date) === start && a.gallery_photos.length + a.gallery_videos.length > 0);

  // The admin's figures; the current year falls back to the confirmed ones in school.ts.
  const own = start === current ? school.stats : null;
  const num = (v: number | null | undefined, fallback?: number | null) => v ?? fallback ?? null;
  const stats = [
    { value: num(row?.students, own?.students), label: t.students },
    { value: num(row?.staff, own?.staff), label: t.staff },
    { value: num(row?.classes, own?.classes), label: t.classes },
    { value: num(row?.graduates), label: t.graduates },
  ].filter((s): s is { value: number; label: string } => s.value != null);
  const summary = row ? localized(row, "summary", lang) : "";
  const nothing = !stats.length && !summary && !news.length && !events.length && !albums.length;
  const others = [...new Set([current, ...years.map((y) => y.start_year)])].filter((y) => y !== start).sort((a, b) => b - a);

  return (
    <>
      <SetSiteYear start={start} current={current} />
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        kicker={start === current ? t.current : t.kicker}
        title={fill(t.title, { y: yearLabel(start) })}
        intro={t.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {stats.length > 0 && <StatTiles stats={stats} />}
        {summary && (
          <section className="reveal mb-10 rounded-[14px] border border-slate-200 bg-white p-6 sm:p-7">
            <h2 className="font-display mb-3 text-lg font-bold text-slate-900">{t.summary}</h2>
            <RichText text={summary} />
          </section>
        )}
        {nothing && <EmptyState>{t.empty}</EmptyState>}

        {news.length > 0 && (
          <section className="mb-12">
            <SectionHead kicker={plural(dict.search.found, news.length, lang)} title={t.news} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} lang={lang} dict={dict} layout="card" />
              ))}
            </div>
          </section>
        )}
        {events.length > 0 && (
          <section className="mb-12">
            <SectionHead kicker={plural(dict.search.found, events.length, lang)} title={t.events} />
            <div className="space-y-3">
              {events.map((e) => (
                <EventItem key={e.id} event={e} lang={lang} dict={dict} past={past.includes(e)} />
              ))}
            </div>
          </section>
        )}
        {albums.length > 0 && (
          <section className="mb-12">
            <SectionHead kicker={plural(dict.search.found, albums.length, lang)} title={t.albums} />
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} lang={lang} dict={dict} />
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <nav aria-label={t.other} className="mt-4 border-t border-slate-200 pt-8">
            <h2 className="mb-3 text-sm font-bold text-slate-500">{t.other}</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((y) => (
                <Link
                  key={y}
                  href={`/${lang}/year/${y}`}
                  className="press rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-brand hover:text-brand"
                >
                  {yearLabel(y)}
                  {y === current && ` · ${t.current}`}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </>
  );
}
