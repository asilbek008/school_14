import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localized, mediaUrl, type News } from "@/lib/content";
import { newsColors } from "@/lib/categories";
import { formatDate } from "@/lib/format";

export default function NewsCard({ item, lang, dict }: { item: News; lang: Locale; dict: Dictionary }) {
  const title = localized(item, "title", lang);
  const cover = mediaUrl(item.cover_image);
  const excerpt = localized(item, "body", lang).slice(0, 160);
  const colors = newsColors[item.category];

  return (
    <Link
      href={`/${lang}/news/${item.slug}`}
      data-cat={item.category}
      className="reveal lift group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${colors.cover}`}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-105"
          />
        ) : (
          // No photo: a category-colored cover with the date, like a printed notice.
          item.published_at && (
            <div className="absolute left-5 top-4 leading-none text-white transition duration-500 ease-(--ease-spring) group-hover:translate-x-1">
              <b className="block text-5xl font-extrabold tracking-tighter">
                {new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "Asia/Tashkent" }).format(new Date(item.published_at))}
              </b>
              <span className="mt-1 block text-sm font-bold opacity-90">
                {new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-GB", { month: "long", timeZone: "Asia/Tashkent" }).format(new Date(item.published_at))}
              </span>
            </div>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.badge}`}>{dict.newsCats[item.category]}</span>
          {item.published_at && <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>}
        </div>
        <h3 className="text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand">{title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{excerpt}</p>
        <span className="mt-4 text-sm font-bold text-brand">
          {dict.common.readMore}{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
