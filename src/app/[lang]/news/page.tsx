import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getNews, type News } from "@/lib/content";
import { newsCategories } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import EmptyState from "@/components/EmptyState";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.news.title };
}

/** "2026-09": the month a date falls in, Tashkent time. */
const tashkentMonth = (date: string | number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit" }).format(new Date(date));

/** Totals for the tiles above the list: all news, this month's, photos (covers and galleries), achievements. */
function totals(news: News[]) {
  const month = tashkentMonth(Date.now());
  return {
    total: news.length,
    month: news.filter((n) => n.published_at && tashkentMonth(n.published_at) === month).length,
    photos: news.reduce((sum, n) => sum + (n.cover_image ? 1 : 0) + (n.news_photos?.[0]?.count ?? 0), 0),
    wins: news.filter((n) => n.category === "yutuq").length,
  };
}

export default async function NewsPage({ params }: PageProps<"/[lang]/news">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.news;
  const news = await getNews();
  const present = newsCategories.filter((c) => news.some((n) => n.category === c));
  const n = totals(news);
  const stats = [
    { value: n.total, label: plural(t.statTotal, n.total, lang), bg: "from-[#3e72e8] to-brand-deep" },
    { value: n.month, label: t.statMonth, bg: "from-[#17a090] to-[#0c6d62]" },
    { value: n.photos, label: plural(t.statPhotos, n.photos, lang), bg: "from-[#e0a33e] to-gold-deep" },
    { value: n.wins, label: plural(t.statWins, n.wins, lang), bg: "from-[#d2664e] to-[#a63b28]" },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        title={t.title}
        intro={news.length ? fill(t.countIntro, { n: news.length }) : t.intro}
        kicker={t.kicker}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {news.length ? (
          <>
            {/* Totals, as colored tiles (as on "About" and the gallery). */}
            <div className="mb-8 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
              {stats.map(({ value, label, bg }, i) => (
                <div
                  key={bg}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`reveal relative overflow-hidden rounded-[14px] bg-gradient-to-br px-4 py-4 text-white after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 sm:px-5 sm:py-5 ${bg}`}
                >
                  <b className="font-display block text-2xl font-extrabold leading-none tracking-tight sm:text-[30px]">{value}</b>
                  <span className="mt-1.5 block text-[12.5px] font-semibold opacity-90 sm:text-[13.5px]">{label}</span>
                </div>
              ))}
            </div>
            <CategoryFilter
              allLabel={`${dict.common.all} · ${news.length}`}
              searchLabel={t.search}
              emptyLabel={t.notFound}
              options={present.map((c) => ({ value: c, label: `${t.cats[c]} · ${news.filter((x) => x.category === c).length}` }))}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((item, i) => (
                  <NewsCard key={item.id} item={item} lang={lang} dict={dict} layout={i === 0 ? "featured" : "card"} />
                ))}
              </div>
            </CategoryFilter>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
