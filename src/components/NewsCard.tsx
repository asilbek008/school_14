import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localized, mediaUrl, type News } from "@/lib/content";
import { newsColors } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { itemYear } from "@/lib/school-years";

export default function NewsCard({
  item,
  lang,
  dict,
  layout = "card",
}: {
  item: News;
  lang: Locale;
  dict: Dictionary;
  /**
   * card: the regular grid card. featured: the latest article on the news page (twice as wide,
   * side by side on large screens). tall: the big card on the home page. row: a compact card with
   * the picture on the left (beside the tall one on the home page).
   */
  layout?: "card" | "featured" | "tall" | "row";
}) {
  const featured = layout === "featured";
  const row = layout === "row";
  const big = featured || layout === "tall";
  const title = localized(item, "title", lang);
  const cover = mediaUrl(item.cover_image);
  const excerpt = localized(item, "body", lang).slice(0, big ? 260 : 160);
  const colors = newsColors[item.category];
  const photoCount = (item.news_photos?.[0]?.count ?? 0) + (cover ? 1 : 0);

  return (
    <Link
      href={`/${lang}/news/${item.slug}`}
      data-cat={item.category}
      data-year={itemYear(item.school_year, item.published_at) ?? undefined}
      data-q={title.toLowerCase()}
      className={`reveal lift group flex overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:shadow-navy/10 ${
        row ? "flex-row" : "flex-col"
      } ${
        // While a chip or search filters the list (CategoryFilter's data-filtered), the featured card is a normal one.
        featured ? "sm:col-span-2 lg:grid lg:grid-cols-[1.4fr_1fr] group-data-filtered/filter:col-span-1! group-data-filtered/filter:grid-cols-1!" : ""
      } ${layout === "tall" ? "lg:row-span-2" : ""}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${colors.cover} ${
          featured
            ? "aspect-video lg:aspect-auto lg:min-h-80 group-data-filtered/filter:aspect-video! group-data-filtered/filter:min-h-0!"
            : layout === "tall"
              ? "aspect-video lg:aspect-auto lg:min-h-64 lg:flex-1"
              : row
                ? "min-h-28 w-28 sm:w-40"
                : "aspect-video"
        }`}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={big ? "(min-width: 1024px) 50vw, 100vw" : row ? "160px" : "(min-width: 768px) 33vw, 100vw"}
            className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-105"
          />
        ) : (
          // No photo: a category-colored cover with the date, like a printed notice.
          item.published_at && (
            <div className={`absolute leading-none text-white transition duration-500 ease-(--ease-spring) group-hover:translate-x-1 ${row ? "left-3 top-3" : "left-5 top-4"}`}>
              <b className={`block font-extrabold tracking-tighter ${row ? "text-3xl" : "text-5xl"}`}>
                {new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "Asia/Tashkent" }).format(new Date(item.published_at))}
              </b>
              <span className={`mt-1 block font-bold opacity-90 ${row ? "text-xs" : "text-sm"}`}>
                {new Intl.DateTimeFormat(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-GB", { month: "long", timeZone: "Asia/Tashkent" }).format(new Date(item.published_at))}
              </span>
            </div>
          )
        )}
        {photoCount > 1 && !row && (
          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
            📷 {photoCount}
          </span>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${big ? "p-6 lg:p-8" : row ? "p-4" : "p-5"}`}>
        <div className={`mb-2 flex flex-wrap items-center gap-2 text-slate-500 ${row ? "text-xs" : "text-sm"}`}>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.badge}`}>{dict.newsCats[item.category]}</span>
          {item.published_at && <time dateTime={item.published_at}>{formatDate(item.published_at, lang)}</time>}
        </div>
        <h3
          className={`font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand ${
            big ? "text-2xl tracking-tight lg:text-3xl" : row ? "line-clamp-2 text-base" : "text-lg"
          }`}
        >
          {title}
        </h3>
        <p className={`mt-2 flex-1 text-slate-600 ${big ? "line-clamp-4" : row ? "line-clamp-2 text-sm max-sm:hidden" : "line-clamp-3 text-sm"}`}>{excerpt}</p>
        <span className={`text-sm font-bold text-brand ${row ? "mt-2" : "mt-4"}`}>
          {dict.common.readMore}{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
