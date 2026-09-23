import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localized, type SchoolEvent } from "@/lib/content";
import { eventColors } from "@/lib/categories";
import { formatDate, formatDateTime } from "@/lib/format";

const monthShort: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };

export default function EventItem({ event, lang, dict }: { event: SchoolEvent; lang: Locale; dict: Dictionary }) {
  const start = new Date(event.starts_at);
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(monthShort[lang], { ...opts, timeZone: "Asia/Tashkent" }).format(start);
  const colors = eventColors[event.category];
  const description = localized(event, "description", lang);

  return (
    <article data-cat={event.category} className="reveal lift group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-xl leading-none transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-3 group-hover:scale-105 ${colors.tile}`}>
        <b className="text-2xl">{part({ day: "numeric" })}</b>
        <small className="mt-1 text-xs font-bold uppercase">{part({ month: "short" }).replace(".", "")}</small>
      </div>
      <div className="min-w-0">
        <span className={`mb-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.badge}`}>
          {dict.eventCats[event.category]}
        </span>
        <h3 className="font-bold text-slate-900">{localized(event, "title", lang)}</h3>
        <p className="text-sm text-slate-500">
          <time dateTime={event.starts_at}>
            {event.all_day ? formatDate(event.starts_at, lang) : formatDateTime(event.starts_at, lang)}
          </time>
          {event.location && (
            <>
              {" · "}
              <span className="sr-only">{dict.events.location}: </span>
              {event.location}
            </>
          )}
        </p>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      </div>
    </article>
  );
}
