import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localized, type SchoolEvent } from "@/lib/content";
import { eventColors } from "@/lib/categories";
import { formatDateFull } from "@/lib/format";

const monthLocale: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };

/** Compact event card for the home page (as in the design mockup): date tile, title, date and category. */
export default function EventCard({ event, lang, dict }: { event: SchoolEvent; lang: Locale; dict: Dictionary }) {
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(monthLocale[lang], { ...opts, timeZone: "Asia/Tashkent" }).format(new Date(event.starts_at));
  return (
    <Link
      href={`/${lang}/events#upcoming`}
      className="reveal lift group flex items-center gap-3.5 rounded-[14px] border border-slate-200 bg-white px-[18px] py-4 hover:border-slate-300"
    >
      <span
        className={`flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-[14px] leading-none transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-3 group-hover:scale-105 ${eventColors[event.category].tile}`}
      >
        <b className="font-display text-[22px]">{part({ day: "numeric" })}</b>
        <small className="mt-1 text-[11px] font-bold uppercase">{part({ month: "short" }).replace(".", "")}</small>
      </span>
      <span className="min-w-0">
        <b className="font-display block text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand">
          {localized(event, "title", lang)}
        </b>
        <span className="mt-0.5 block text-[12.5px] text-slate-500 first-letter:uppercase">
          {formatDateFull(event.starts_at, lang)} • {dict.eventCats[event.category]}
        </span>
      </span>
    </Link>
  );
}
