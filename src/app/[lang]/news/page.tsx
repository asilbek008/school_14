import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getNews } from "@/lib/content";
import { newsCategories } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import EmptyState from "@/components/EmptyState";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.news };
}

export default async function NewsPage({ params }: PageProps<"/[lang]/news">) {
  const { lang, dict } = await resolveLang(params);
  const news = await getNews();
  const present = newsCategories.filter((c) => news.some((n) => n.category === c));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.news} intro={dict.news.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {news.length ? (
          <CategoryFilter
            allLabel={dict.common.all}
            options={present.map((c) => ({ value: c, label: dict.newsCats[c] }))}
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item, i) => (
                <NewsCard key={item.id} item={item} lang={lang} dict={dict} featured={i === 0} />
              ))}
            </div>
          </CategoryFilter>
        ) : (
          <EmptyState>{dict.news.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
