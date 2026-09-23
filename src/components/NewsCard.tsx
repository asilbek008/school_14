import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localized, mediaUrl, type News } from "@/lib/content";
import { formatDate } from "@/lib/format";

export default function NewsCard({ item, lang, readMore }: { item: News; lang: Locale; readMore: string }) {
  const title = localized(item, "title", lang);
  const cover = mediaUrl(item.cover_image);
  const excerpt = localized(item, "body", lang).slice(0, 160);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-video bg-brand-soft">
        {cover && <Image src={cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {item.published_at && (
          <time dateTime={item.published_at} className="text-sm text-slate-500">
            {formatDate(item.published_at, lang)}
          </time>
        )}
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{excerpt}</p>
        <Link href={`/${lang}/news/${item.slug}`} className="mt-4 text-sm font-medium text-brand hover:underline">
          {readMore} →
        </Link>
      </div>
    </article>
  );
}
