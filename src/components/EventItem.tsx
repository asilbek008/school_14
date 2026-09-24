import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localized, type SchoolEvent } from "@/lib/content";
import { eventColors } from "@/lib/categories";
import { formatDateFull, formatTime } from "@/lib/format";
import DaysLeft from "./DaysLeft";

const monthShort: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };

/**
 * One event as an accordion (<details>, so it opens without JS): date tile, title and full date, and
 * for coming events how many days are left; opening shows the category, time, place and description.
 */
export default function EventItem({ event, lang, dict, past = false }: { event: SchoolEvent; lang: Locale; dict: Dictionary; past?: boolean }) {
  const start = new Date(event.starts_at);
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(monthShort[lang], { ...opts, timeZone: "Asia/Tashkent" }).format(start);
  const colors = eventColors[event.category];
  const description = localized(event, "description", lang);
  const t = dict.events;

  return (
    <details
      data-cat={event.category}
      data-q={`${localized(event, "title", lang)} ${event.location ?? ""}`.toLowerCase()}
      className="acc reveal group rounded-2xl border border-slate-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-slate-300 open:border-brand open:shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 rounded-2xl p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className={`flex h-[60px] w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-3 group-hover:scale-105 ${colors.tile} ${
            past ? "opacity-75 grayscale-[0.6]" : ""
          }`}
        >
          <b className="text-[22px]">{part({ day: "numeric" })}</b>
          <small className="mt-1 text-[11px] font-bold uppercase">{part({ month: "short" }).replace(".", "")}</small>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug text-slate-900">{localized(event, "title", lang)}</span>
          <time dateTime={event.starts_at} className="mt-0.5 block text-[13px] text-slate-500 first-letter:uppercase">
            {formatDateFull(event.starts_at, lang)}
          </time>
          {/* On phones the countdown goes under the date, so the title keeps the width. */}
          {!past && (
            <span className="mt-1.5 flex sm:hidden">
              <DaysLeft startsAt={event.starts_at} lang={lang} t={t} />
            </span>
          )}
        </span>
        {!past && (
          <span className="hidden sm:flex">
            <DaysLeft startsAt={event.starts_at} lang={lang} t={t} />
          </span>
        )}
        <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-slate-400 transition-transform duration-300 ease-(--ease-spring) group-open:rotate-180 group-open:text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="px-4 pb-5 sm:px-5 sm:pl-[92px]">
        <div className="mb-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.badge}`}>{dict.eventCats[event.category]}</span>
          <span>
            {t.time}: <b className="text-slate-800">{event.all_day ? dict.common.allDay : formatTime(event.starts_at, lang)}</b>
          </span>
          {event.location && (
            <span>
              {t.location}: <b className="text-slate-800">{event.location}</b>
            </span>
          )}
        </div>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{description || t.noDetails}</p>
      </div>
    </details>
  );
}
