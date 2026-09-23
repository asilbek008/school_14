import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { getEvents, getNews } from "@/lib/content";
import NewsCard from "@/components/NewsCard";
import EventItem from "@/components/EventItem";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);
  const [news, { upcoming }] = await Promise.all([getNews(3), getEvents()]);

  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <h1 className="max-w-3xl text-4xl font-bold sm:text-5xl">{dict.home.welcome}</h1>
          <p className="mt-4 max-w-2xl text-lg text-blue-100">{dict.home.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/${lang}/admissions`} className="rounded-lg bg-white px-5 py-3 font-semibold text-blue-800 hover:bg-blue-50">
              {dict.home.ctaAdmissions}
            </Link>
            <Link href={`/${lang}/contact`} className="rounded-lg border border-white/60 px-5 py-3 font-semibold hover:bg-white/10">
              {dict.home.ctaContact}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.latestNews}</h2>
          <Link href={`/${lang}/news`} className="text-sm font-medium text-blue-700 hover:underline">
            {dict.home.allNews} →
          </Link>
        </div>
        {news.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} readMore={dict.common.readMore} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.news.empty}</EmptyState>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.upcomingEvents}</h2>
          <Link href={`/${lang}/events`} className="text-sm font-medium text-blue-700 hover:underline">
            {dict.home.allEvents} →
          </Link>
        </div>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.slice(0, 4).map((event) => (
              <EventItem key={event.id} event={event} lang={lang} locationLabel={dict.events.location} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
        )}
      </section>
    </>
  );
}
