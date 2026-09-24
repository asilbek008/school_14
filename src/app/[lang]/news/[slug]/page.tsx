import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getNews, getNewsBySlug, localized, mediaUrl } from "@/lib/content";
import { newsColors } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import RichText from "@/components/RichText";
import Lightbox from "@/components/Lightbox";
import PhotoFrame from "@/components/PhotoFrame";
import NewsCard from "@/components/NewsCard";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/news/[slug]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const item = await getNewsBySlug((await params).slug);
  if (!item) return {};
  const cover = mediaUrl(item.cover_image);
  return {
    title: localized(item, "title", lang),
    description: localized(item, "body", lang).slice(0, 160),
    openGraph: cover ? { images: [cover] } : undefined,
  };
}

export default async function NewsArticlePage({ params }: PageProps<"/[lang]/news/[slug]">) {
  const { lang, dict } = await resolveLang(params);
  const [item, latest] = await Promise.all([getNewsBySlug((await params).slug), getNews(4)]);
  if (!item) notFound();
  const title = localized(item, "title", lang);
  const cover = mediaUrl(item.cover_image);
  const colors = newsColors[item.category];
  const more = latest.filter((n) => n.id !== item.id).slice(0, 3);
  const photos = item.news_photos.map((p) => mediaUrl(p.path)!);

  return (
    <article className="pb-16">
      <header className="mx-auto max-w-3xl px-4 pt-8">
        <Link href={`/${lang}/news`} className="text-sm font-bold text-brand link-grow">
          ← {dict.common.back}
        </Link>
        <div className="mt-6 flex animate-fade-up flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors.badge}`}>{dict.newsCats[item.category]}</span>
          {item.published_at && <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>}
          {photos.length > 0 && (
            <a href="#photos" className="font-semibold text-brand hover:underline">
              📷 {photos.length + (cover ? 1 : 0)}
            </a>
          )}
        </div>
        <h1 className="mt-3 animate-fade-up text-3xl font-extrabold leading-tight tracking-tight text-slate-900 [animation-delay:60ms] sm:text-5xl">
          {title}
        </h1>
      </header>

      {cover && (
        <div className="mx-auto mt-8 max-w-5xl animate-fade-up px-4 [animation-delay:120ms]">
          <PhotoFrame src={cover} alt={title} priority className="aspect-[4/3] rounded-3xl shadow-xl shadow-navy/10 sm:aspect-[16/9]" />
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl px-4 text-lg">
        <RichText text={localized(item, "body", lang)} />
      </div>

      {photos.length > 0 && (
        <section id="photos" className="mx-auto mt-14 max-w-5xl scroll-mt-24 px-4">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-slate-900">
            {dict.news.photos} <span className="font-semibold text-slate-400">· {photos.length}</span>
          </h2>
          <Lightbox
            photos={photos}
            alt={title}
            layout="mosaic"
            t={{ close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next }}
          />
        </section>
      )}

      {more.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl border-t border-slate-200 px-4 pt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{dict.news.more}</h2>
            <Link href={`/${lang}/news`} className="group shrink-0 text-sm font-bold text-brand">
              {dict.home.allNews} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((n) => (
              <NewsCard key={n.id} item={n} lang={lang} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
