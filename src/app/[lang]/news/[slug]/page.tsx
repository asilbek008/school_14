import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getNewsBySlug, localized, mediaUrl } from "@/lib/content";
import { formatDate } from "@/lib/format";
import RichText from "@/components/RichText";

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
  const item = await getNewsBySlug((await params).slug);
  if (!item) notFound();
  const cover = mediaUrl(item.cover_image);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/${lang}/news`} className="text-sm font-medium text-brand hover:underline">
        ← {dict.common.back}
      </Link>
      {item.published_at && (
        <time dateTime={item.published_at} className="mt-6 block text-sm text-slate-500">
          {formatDate(item.published_at, lang)}
        </time>
      )}
      <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">{localized(item, "title", lang)}</h1>
      {cover && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl bg-brand-soft">
          <Image src={cover} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="mt-8">
        <RichText text={localized(item, "body", lang)} />
      </div>
    </article>
  );
}
