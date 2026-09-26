import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getAlumni, getSchoolYears, localized, mediaUrl } from "@/lib/content";
import { avatarGradient, initials } from "@/lib/positions";
import { currentSchoolYear } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import StatTiles from "@/components/StatTiles";
import SectionHead from "@/components/SectionHead";
import CategoryFilter from "@/components/CategoryFilter";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

const FOUNDED = 1976;

export async function generateMetadata({ params }: PageProps<"/[lang]/alumni">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.alumni.title, description: dict.alumni.intro };
}

/**
 * Alumni: how many graduated each year (the admin's figures in school_years; the class of a school year graduates
 * in its second calendar year) and the notable graduates who agreed to be shown.
 */
export default async function AlumniPage({ params }: PageProps<"/[lang]/alumni">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.alumni;
  const [alumni, years] = await Promise.all([getAlumni(), getSchoolYears()]);
  const classes = years.filter((y) => y.graduates != null).map((y) => ({ year: y.start_year + 1, count: y.graduates! }));
  const total = classes.reduce((a, c) => a + c.count, 0);
  const stats = [
    ...(total ? [{ value: total, label: t.statGraduates }, { value: classes.length, label: t.statYears }] : []),
    { value: alumni.length, label: t.statNotable },
    { value: currentSchoolYear().from - FOUNDED, label: t.statAge },
  ];

  const list = (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {alumni.map((a) => {
        const occupation = localized(a, "occupation", lang);
        const story = localized(a, "story", lang);
        const photo = mediaUrl(a.photo);
        return (
          <li
            key={a.id}
            data-q={`${a.full_name} ${occupation} ${a.graduation_year}`.toLowerCase()}
            className="reveal flex flex-col rounded-[14px] border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-4">
              {photo ? (
                <Image src={photo} alt={a.full_name} width={128} height={128} className="size-16 shrink-0 rounded-2xl object-cover" />
              ) : (
                <span className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white ${avatarGradient(a.id)}`}>
                  {initials(a.full_name)}
                </span>
              )}
              <span className="min-w-0">
                <b className="font-display block text-[17px] leading-snug text-slate-900">{a.full_name}</b>
                <span className="mt-0.5 block text-[13px] font-semibold text-brand">
                  {fill(t.class, { y: a.graduation_year })}
                  {a.class_label && ` · ${a.class_label}`}
                </span>
              </span>
            </div>
            {occupation && <p className="mt-3 text-[14.5px] font-medium text-slate-800">{occupation}</p>}
            {story &&
              (story.length > 220 ? (
                <details className="acc group mt-2 text-[14px] leading-relaxed text-slate-600">
                  <summary className="cursor-pointer list-none">
                    <span className="group-open:hidden">
                      {story.slice(0, 200).trimEnd()}… <span className="font-semibold text-brand">{t.more}</span>
                    </span>
                    <span className="hidden font-semibold text-brand group-open:inline">{t.less}</span>
                  </summary>
                  <p className="mt-1 whitespace-pre-line">{story}</p>
                </details>
              ) : (
                <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-slate-600">{story}</p>
              ))}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <StatTiles stats={stats} />

        {alumni.length > 0 && (
          <section className="mb-12">
            <SectionHead kicker={t.notableKicker} title={t.notable} />
            {alumni.length > 6 ? (
              <CategoryFilter allLabel={dict.common.all} searchLabel={t.search} emptyLabel={t.notFound} options={[]}>
                {list}
              </CategoryFilter>
            ) : (
              list
            )}
          </section>
        )}

        {classes.length > 0 && (
          <section className="mb-12">
            <SectionHead kicker={t.byYearKicker} title={t.byYear} />
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <li key={c.year} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-800">{fill(t.yearLine, { y: c.year })}</span>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-0.5 text-sm font-bold text-brand-deep">{plural(t.people, c.count, lang)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!alumni.length && !classes.length && <EmptyState>{t.empty}</EmptyState>}

        <div className="chrome mt-4 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="relative max-w-2xl text-[15px] leading-relaxed text-[#cfd6ea]">🎓 {t.invite}</p>
          <Link href={`/${lang}/contact`} className="press relative shrink-0 rounded-full bg-gold px-6 py-3 font-bold text-[#241703] hover:bg-[#eba53c]">
            {t.write} →
          </Link>
        </div>
      </div>
    </>
  );
}
