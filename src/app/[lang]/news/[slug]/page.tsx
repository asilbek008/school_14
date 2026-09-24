import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getNews, getNewsBySlug, getPrograms, localized, mediaUrl } from "@/lib/content";
import { newsColors } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import RichText from "@/components/RichText";
import Lightbox from "@/components/Lightbox";
import PhotoFrame from "@/components/PhotoFrame";
import PageHeader from "@/components/PageHeader";

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
  const [item, latest, programs] = await Promise.all([getNewsBySlug((await params).slug), getNews(5), getPrograms()]);
  if (!item) notFound();
  const title = localized(item, "title", lang);
  const cover = mediaUrl(item.cover_image);
  const more = latest.filter((n) => n.id !== item.id).slice(0, 4);
  const photos = item.news_photos.map((p) => mediaUrl(p.path)!);
  // News about a regular program is listed on that program's page, so "back" leads there.
  const text = `${item.title_uz} ${item.body_uz}`.toLowerCase();
  const program = programs.find((p) => p.keyword && text.includes(p.keyword.toLowerCase()));
  const back = program
    ? { href: `/${lang}/programs/${program.slug}`, label: localized(program, "name", lang) }
    : { href: `/${lang}/news`, label: dict.news.all };
  const crumbs = [{ href: `/${lang}`, label: dict.nav.home }, program ? back : { href: `/${lang}/news`, label: dict.nav.news }];

  // As in the design mockup: a banner (category, title, date), the article card, and the other news beside it.
  return (
    <>
      <PageHeader crumbs={crumbs} kicker={dict.newsCats[item.category]} title={title} intro={item.published_at ? formatDate(item.published_at, lang) : undefined} />
      <div className="mx-auto grid max-w-6xl items-start gap-9 px-4 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Link href={back.href} className="group mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
            <span aria-hidden className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
            {back.label}
          </Link>
          <article className="rounded-[14px] border border-slate-200 bg-white p-3.5 pb-8">
            {cover && <PhotoFrame src={cover} alt={title} priority className="mb-7 aspect-[4/3] rounded-xl sm:aspect-[16/9]" />}
            {/* Category and date are in the banner; only the photo count is added here. */}
            {photos.length > 0 && (
              <a href="#photos" className="mb-4 inline-block px-2.5 text-sm font-semibold text-brand hover:underline sm:px-6">
                📷 {photos.length + (cover ? 1 : 0)}
              </a>
            )}
            <div className={`max-w-[72ch] px-2.5 text-base leading-[1.8] sm:px-6 ${cover ? "" : "pt-4"}`}>
              <RichText text={localized(item, "body", lang)} />
            </div>
          </article>

          {photos.length > 0 && (
            <section id="photos" className="mt-10 scroll-mt-24">
              <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-slate-900">
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
        </div>

        {more.length > 0 && (
          <aside className="rounded-[14px] border border-slate-200 bg-white px-5 pb-3 pt-5 lg:sticky lg:top-24 lg:mt-[38px]">
            <h2 className="font-display mb-2.5 text-base font-bold text-slate-900">{dict.news.more}</h2>
            {more.map((n) => {
              const nCover = mediaUrl(n.cover_image);
              return (
                <Link key={n.id} href={`/${lang}/news/${n.slug}`} className="group -mx-2.5 flex items-center gap-3 rounded-[14px] p-2.5 transition-colors hover:bg-paper">
                  <span className={`relative grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br text-white ${newsColors[n.category].cover}`}>
                    {nCover ? (
                      <Image src={nCover} alt="" fill sizes="50px" className="object-cover" />
                    ) : (
                      n.published_at && (
                        <b className="font-display text-lg leading-none">
                          {new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "Asia/Tashkent" }).format(new Date(n.published_at))}
                        </b>
                      )
                    )}
                  </span>
                  <span className="min-w-0">
                    <b className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand">{localized(n, "title", lang)}</b>
                    {n.published_at && <small className="mt-0.5 block text-xs text-slate-500">{formatDate(n.published_at, lang)}</small>}
                  </span>
                </Link>
              );
            })}
            <Link href={`/${lang}/news`} className="group mt-1.5 flex items-center gap-1 border-t border-slate-100 py-3 text-sm font-bold text-brand">
              {dict.home.allNews} <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}
