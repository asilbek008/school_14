import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getContestCounts, getContests, localized } from "@/lib/content";
import { formatDate, formatDateTime } from "@/lib/format";
import { achievementLevels, type AchievementLevel } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import DaysLeft from "@/components/DaysLeft";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/contests">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.contests.title, description: dict.contests.lead };
}

const levelTint: Record<AchievementLevel, string> = {
  maktab: "bg-slate-100 text-slate-600",
  tuman: "bg-teal-soft text-[#0c6d62]",
  viloyat: "bg-brand-soft text-brand-deep",
  respublika: "bg-gold-soft text-gold-deep",
  xalqaro: "bg-[#fae7e2] text-[#c9553f]",
};
const levelOf = (v: string): AchievementLevel => ((achievementLevels as readonly string[]).includes(v) ? (v as AchievementLevel) : "maktab");
const open = (until: string | null) => !until || new Date(until) > new Date();
const when = (iso: string, allDay: boolean, lang: Locale) => (allDay ? formatDate(iso, lang) : formatDateTime(iso, lang));

/** Contests a pupil can sign up for, the open ones first. Results land on the achievements wall later. */
export default async function ContestsPage({ params }: PageProps<"/[lang]/contests">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.contests;
  const [items, counts] = await Promise.all([getContests(), getContestCounts()]);

  const openNow = items.filter((c) => open(c.registration_until));
  const closed = items.filter((c) => !open(c.registration_until));
  const signedUp = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.lead} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {items.length === 0 ? (
          <EmptyState>{t.empty}</EmptyState>
        ) : (
          <>
            <StatTiles
              stats={[
                { value: openNow.length, label: t.stats.open },
                { value: items.length, label: t.stats.all },
                { value: signedUp, label: t.stats.entries },
              ]}
            />

            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {[...openNow, ...closed].map((c) => {
                const isOpen = open(c.registration_until);
                const n = counts[c.slug] ?? 0;
                return (
                  <li key={c.id} className="reveal">
                    <Link
                      href={`/${lang}/contests/${c.slug}`}
                      className="lift group block h-full rounded-[14px] border border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_18px_40px_-28px_rgb(15_23_42/0.5)]"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide ${levelTint[levelOf(c.level)]}`}>
                          {dict.achievements.levels[levelOf(c.level)]}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${isOpen ? "bg-teal-soft text-[#0c6d62]" : "bg-slate-100 text-slate-500"}`}
                        >
                          {isOpen ? t.open : t.closed}
                        </span>
                        {/* How many days are left — worked out in the browser, so the cached page never goes stale. */}
                        {isOpen && c.registration_until && <DaysLeft startsAt={c.registration_until} lang={lang} t={t.left} />}
                      </div>
                      <b className="block text-[17px] font-bold text-navy group-hover:text-brand-deep">{localized(c, "title", lang)}</b>
                      <p className="mt-1 text-sm text-slate-600">
                        {c.grade_from || c.grade_to ? fill(t.grades, { from: c.grade_from ?? 1, to: c.grade_to ?? 11 }) : t.allGrades}
                        {c.place && ` · ${c.place}`}
                        {c.organizer && ` · ${c.organizer}`}
                      </p>
                      {c.starts_at && <p className="mt-1 text-sm font-semibold text-slate-700">{when(c.starts_at, c.all_day, lang)}</p>}
                      <p className="mt-3 text-[13px] font-semibold text-slate-500">
                        {c.external ? c.organizer ?? t.kicker : fill(t.signedUp, { n })}
                        {isOpen && c.registration_until && ` · ${fill(t.until, { d: formatDateTime(c.registration_until, lang) })}`}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
