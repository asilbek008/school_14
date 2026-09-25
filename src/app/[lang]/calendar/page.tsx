import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getCalendar, localized } from "@/lib/content";
import { formatDayRange, formatMonth } from "@/lib/format";
import { currentSchoolYear } from "@/lib/school";
import { yearLabel } from "@/lib/school-years";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CalendarNow, { type NowItem } from "./CalendarNow";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/calendar">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.calendar.title };
}

const DAY = 86_400_000;
const dayOf = (iso: string) => Math.floor(Date.parse(iso) / DAY);
/** The Tashkent calendar day of a timestamp: "2026-10-01". */
const tashkentDate = (ts: string) => new Date(Date.parse(ts) + 5 * 3_600_000).toISOString().slice(0, 10);

const bar: Record<string, string> = {
  chorak: "bg-brand",
  tatil: "bg-teal",
  imtihon: "bg-gold",
  boshqa: "bg-slate-400",
  bayram: "bg-[#d2664e]",
};
const badge: Record<string, string> = {
  chorak: "bg-brand-soft text-brand-deep",
  tatil: "bg-teal-soft text-[#0c6d62]",
  imtihon: "bg-gold-soft text-gold-deep",
  boshqa: "bg-slate-100 text-slate-600",
  bayram: "bg-[#fae7e2] text-[#c9553f]",
};

type Item = NowItem & { note: string };

/** The school year at a glance: today's period, a year-long bar (wide screens) and the months in order. */
export default async function CalendarPage({ params }: PageProps<"/[lang]/calendar">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.calendar;
  const start = currentSchoolYear().from;
  const { periods, holidays } = await getCalendar(start);

  const items: Item[] = [
    ...periods.map((p) => ({
      title: localized(p, "title", lang),
      note: localized(p, "note", lang),
      kind: p.kind,
      kindLabel: t.kinds[p.kind],
      from: p.starts_on,
      to: p.ends_on,
    })),
    ...holidays.map((h) => {
      const from = tashkentDate(h.starts_at);
      const to = h.ends_at ? tashkentDate(h.ends_at) : from;
      return { title: localized(h, "title", lang), note: "", kind: "bayram", kindLabel: t.kinds.bayram, from, to: to < from ? from : to };
    }),
  ]
    .map((i) => ({ ...i, range: formatDayRange(i.from, i.to, lang) }))
    .sort((a, b) => a.from.localeCompare(b.from) || Number(b.kind === "chorak") - Number(a.kind === "chorak"));

  const quarters = periods.filter((p) => p.kind === "chorak").length;
  const holidayDays = periods.filter((p) => p.kind === "tatil").reduce((n, p) => n + dayOf(p.ends_on) - dayOf(p.starts_on) + 1, 0);
  const exams = periods.filter((p) => p.kind === "imtihon").length;
  const stats = [
    { value: quarters, label: plural(t.statQuarters, quarters, lang) },
    { value: holidayDays, label: plural(t.statHolidayDays, holidayDays, lang) },
    { value: exams, label: plural(t.statExams, exams, lang) },
    { value: holidays.length, label: plural(t.statBayram, holidays.length, lang) },
  ];

  // The year-long bar: 1 September – 31 August, each period placed by its dates.
  const yearStart = dayOf(`${start}-09-01`);
  const yearDays = dayOf(`${start + 1}-09-01`) - yearStart;
  const place = (i: Item) => {
    const from = Math.max(dayOf(i.from), yearStart) - yearStart;
    const to = Math.min(dayOf(i.to), yearStart + yearDays - 1) - yearStart;
    const share = ((to - from + 1) / yearDays) * 100;
    // A label only fits on a bar of about three weeks or more; shorter ones keep it in the tooltip.
    return { style: { left: `${(from / yearDays) * 100}%`, width: `max(${share}%, 6px)` }, label: share >= 6 };
  };
  const months = Array.from({ length: 12 }, (_, m) => {
    const month = ((8 + m) % 12) + 1;
    const year = m < 4 ? start : start + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return { key, name: formatMonth(`${key}-01`, lang), items: items.filter((i) => i.from.startsWith(key)) };
  });
  const rows = [items.filter((i) => i.kind === "chorak"), items.filter((i) => i.kind !== "chorak" && i.kind !== "bayram"), items.filter((i) => i.kind === "bayram")];

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={fill(t.intro, { year: yearLabel(start) })} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {items.length ? (
          <>
            <StatTiles stats={stats} />
            <CalendarNow items={items} lang={lang} t={t} />

            <section className="reveal mb-10 hidden rounded-[14px] border border-slate-200 bg-white p-6 md:block" aria-label={t.timeline}>
              <h2 className="font-display mb-4 text-lg font-bold text-slate-900">{t.timeline}</h2>
              <div className="grid grid-cols-12 border-b border-slate-100 pb-2 text-[12px] font-semibold text-slate-500">
                {months.map((m) => (
                  <span key={m.key} className="truncate">
                    {m.name}
                  </span>
                ))}
              </div>
              <div className="relative mt-3 space-y-2">
                {/* Month gridlines behind the bars. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-12">
                  {months.map((m) => (
                    <span key={m.key} className="border-l border-slate-100 first:border-0" />
                  ))}
                </div>
                {rows.map((row, r) =>
                  row.length ? (
                    <div key={r} className={`relative ${r === 2 ? "h-3" : "h-7"}`}>
                      {row.map((i) => {
                        const { style, label } = place(i);
                        return (
                          <span
                            key={`${i.kind}-${i.from}-${i.title}`}
                            title={`${i.title} · ${i.range}`}
                            style={style}
                            className={`absolute inset-y-0 overflow-hidden rounded-md px-1.5 text-[11.5px] font-bold leading-7 whitespace-nowrap text-ellipsis text-white ${bar[i.kind] ?? bar.boshqa}`}
                          >
                            {label && i.kind !== "bayram" ? i.title : ""}
                          </span>
                        );
                      })}
                    </div>
                  ) : null,
                )}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-slate-600">
                {(["chorak", "tatil", "imtihon", "bayram"] as const)
                  .filter((k) => items.some((i) => i.kind === k))
                  .map((k) => (
                    <li key={k} className="flex items-center gap-1.5">
                      <span className={`size-2.5 rounded-sm ${bar[k]}`} />
                      {t.kinds[k]}
                    </li>
                  ))}
              </ul>
            </section>

            <h2 className="font-display mb-4 text-xl font-bold text-slate-900">{t.byMonth}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {months
                .filter((m) => m.items.length)
                .map((m, n) => (
                  <section key={m.key} style={{ animationDelay: `${(n % 6) * 60}ms` }} className="reveal rounded-[14px] border border-slate-200 bg-white p-5">
                    <h3 className="font-display mb-3 text-[17px] font-bold capitalize text-slate-900">
                      {m.name} <span className="font-sans text-sm font-medium text-slate-400">{m.key.slice(0, 4)}</span>
                    </h3>
                    <ul className="space-y-3">
                      {m.items.map((i) => (
                        <li key={`${i.kind}-${i.from}-${i.title}`} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${badge[i.kind] ?? badge.boshqa}`}>{i.kindLabel}</span>
                            <span className="text-[12.5px] font-semibold text-slate-500">{i.range}</span>
                            {i.from !== i.to && (
                              <span className="text-[12.5px] text-slate-400">· {plural(t.days, dayOf(i.to) - dayOf(i.from) + 1, lang)}</span>
                            )}
                          </div>
                          <b className="mt-1 block text-[15px] text-slate-900">{i.title}</b>
                          {i.note && <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600">{i.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </div>
            <p className="mt-6 rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.note}</p>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
