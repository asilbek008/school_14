import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getContest, getContestCounts, getContests, localized } from "@/lib/content";
import { formatDate, formatDateTime } from "@/lib/format";
import { achievementLevels, type AchievementLevel } from "@/lib/categories";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import DaysLeft from "@/components/DaysLeft";
import EntryForm from "./EntryForm";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getContests()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/contests/[slug]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const contest = await getContest((await params).slug);
  if (!contest) return { title: dict.contests.title };
  return { title: localized(contest, "title", lang), description: localized(contest, "description", lang)?.slice(0, 160) };
}

const levelOf = (v: string): AchievementLevel => ((achievementLevels as readonly string[]).includes(v) ? (v as AchievementLevel) : "maktab");

/** One contest: what it is, who may enter, and — while sign-up is open — the form. */
export default async function ContestPage({ params }: PageProps<"/[lang]/contests/[slug]">) {
  const { lang, dict } = await resolveLang(params);
  const { slug } = await params;
  const contest = await getContest(slug);
  if (!contest) notFound();
  const t = dict.contests;

  const counts = await getContestCounts();
  const signedUp = counts[contest.slug] ?? 0;
  const open = !contest.registration_until || new Date(contest.registration_until) > new Date();
  const description = localized(contest, "description", lang);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/contests`, label: t.title },
        ]}
        kicker={dict.achievements.levels[levelOf(contest.level)]}
        title={localized(contest, "title", lang)}
        intro={contest.starts_at ? (contest.all_day ? formatDate(contest.starts_at, lang) : formatDateTime(contest.starts_at, lang)) : undefined}
      />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {description && (
            <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
              <RichText text={description} />
            </section>
          )}

          <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
            <h2 className="mb-4 text-[18px] font-bold text-navy">
              {contest.external ? t.externalTitle : open ? t.entry.title : t.closedTitle}
            </h2>
            {contest.external ? (
              <>
                <p className="text-sm leading-relaxed text-slate-600">{t.externalLead}</p>
                {contest.source_url && (
                  <a
                    href={contest.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press mt-4 inline-block rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white"
                  >
                    {t.externalBtn} ↗
                  </a>
                )}
              </>
            ) : open ? (
              <EntryForm t={t} slug={contest.slug} from={contest.grade_from} to={contest.grade_to} />
            ) : (
              <p className="text-sm leading-relaxed text-slate-600">{t.closedLead}</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <dl className="reveal rounded-[14px] border border-slate-200 bg-white px-5 py-4 text-[14px] leading-relaxed text-slate-700">
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="font-bold text-slate-500">{t.who}</dt>
              <dd className="text-right">
                {contest.grade_from || contest.grade_to ? fill(t.grades, { from: contest.grade_from ?? 1, to: contest.grade_to ?? 11 }) : t.allGrades}
              </dd>
            </div>
            {contest.place && (
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="font-bold text-slate-500">{t.place}</dt>
                <dd className="text-right">{contest.place}</dd>
              </div>
            )}
            {contest.organizer && (
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="font-bold text-slate-500">{t.organizer}</dt>
                <dd className="text-right">{contest.organizer}</dd>
              </div>
            )}
            {contest.registration_until && (
              <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <dt className="font-bold text-slate-500">{t.deadline}</dt>
                <dd className="flex flex-wrap items-center justify-end gap-2 text-right">
                  {formatDateTime(contest.registration_until, lang)}
                  {open && <DaysLeft startsAt={contest.registration_until} lang={lang} t={t.left} />}
                </dd>
              </div>
            )}
            {!contest.external && (
              <div className="flex justify-between gap-4 py-2">
                <dt className="font-bold text-slate-500">{t.entriesLabel}</dt>
                <dd className="text-right font-bold text-navy">{signedUp}</dd>
              </div>
            )}
          </dl>

          {/* A date copied from someone else's page is only trustworthy with the page beside it. */}
          {contest.source_url && (
            <div className="reveal rounded-[14px] border border-slate-200 bg-white px-5 py-4 text-[13.5px] leading-relaxed text-slate-600">
              <b className="block text-slate-900">{t.source}</b>
              {t.sourceNote}
              <a
                href={contest.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all font-bold text-brand-deep link-grow"
              >
                {contest.source_url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
              </a>
            </div>
          )}

          <div className="reveal rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
            <b className="block text-slate-900">🔒 {dict.trust.privacyTitle}</b>
            {t.privacy}
          </div>

          <div className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">
            <b className="block text-slate-900">{t.questionsTitle}</b>
            {contest.contact ?? t.questions}
            {school.phone && !contest.contact && (
              <>
                {" "}
                <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-gold-deep link-grow">
                  {school.phone}
                </a>
              </>
            )}
            <Link href={`/${lang}/achievements`} className="mt-2 block font-bold text-gold-deep link-grow">
              {t.pastResults} →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
