import type { Locale } from "@/i18n/config";
import { localized, type SchoolEvent } from "@/lib/content";
import { formatDateTime } from "@/lib/format";

export default function EventItem({ event, lang, locationLabel }: { event: SchoolEvent; lang: Locale; locationLabel: string }) {
  const start = new Date(event.starts_at);
  const day = new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "Asia/Tashkent" }).format(start);
  const description = localized(event, "description", lang);

  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-blue-700 text-xl font-bold text-white">
        {day}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{localized(event, "title", lang)}</h3>
        <p className="text-sm text-slate-500">
          <time dateTime={event.starts_at}>{formatDateTime(event.starts_at, lang)}</time>
          {event.location && (
            <>
              {" · "}
              <span className="sr-only">{locationLabel}: </span>
              {event.location}
            </>
          )}
        </p>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      </div>
    </article>
  );
}
