import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getNews } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.news };
}

export default async function NewsPage({ params }: PageProps<"/[lang]/news">) {
  const { lang, dict } = await resolveLang(params);
  const news = await getNews();

  return (
    <>
      <PageHeader title={dict.nav.news} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {news.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} readMore={dict.common.readMore} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.news.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
