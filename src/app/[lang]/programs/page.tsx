import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getLeagueTables, getNewsMentioning, getPrograms, localized, mediaUrl } from "@/lib/content";
import { isOurSchool } from "@/lib/league";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/programs">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.programs };
}

export default async function ProgramsPage({ params }: PageProps<"/[lang]/programs">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.programs;
  const programs = await getPrograms();
  // Related news gives each card its count and, without an own cover, the newest news photo.
  const [related, leagues] = await Promise.all([
    Promise.all(programs.map((p) => (p.keyword ? getNewsMentioning(p.keyword) : Promise.resolve([])))),
    Promise.all(programs.map((p) => getLeagueTables(p.id))),
  ]);
  // Our school's best place in each league stage, for the card; and our distinct teams, for the tile.
  const bestPlaces = leagues.map((tables) =>
    tables.flatMap((table) => {
      // At our school's own games every team is ours — a place there says nothing.
      const ours = table.stage === "school" ? [] : table.rows.filter(isOurSchool);
      return ours.length ? [{ stage: table.stage, place: Math.min(...ours.map((r) => r.place)) }] : [];
    }),
  );
  const teams = new Set(leagues.flat().flatMap((table) => table.rows.filter(isOurSchool).map((r) => r.team.toLowerCase()))).size;
  const newsTotal = new Set(related.flat().map((n) => n.id)).size;
  const media = programs.reduce((n, p) => n + (p.media[0]?.count ?? 0), 0);
  const stats = [
    { value: programs.length, label: plural(t.statPrograms, programs.length, lang) },
    { value: newsTotal, label: plural(t.statNews, newsTotal, lang) },
    { value: media, label: t.statMedia },
    { value: teams, label: t.statTeams },
  ];

  const cards = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program, i) => {
        const news = related[i];
        const cover = mediaUrl(program.cover ?? news.find((n) => n.cover_image)?.cover_image ?? null);
        const schedule = localized(program, "schedule", lang);
        const place = localized(program, "place", lang);
        return (
          <Link
            key={program.id}
            data-q={`${localized(program, "name", lang)} ${localized(program, "summary", lang)}`.toLowerCase()}
            href={`/${lang}/programs/${program.slug}`}
            className="reveal lift group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-xl hover:shadow-navy/10"
          >
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand to-brand-deep">
              {cover && (
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-105"
                />
              )}
              {news.length > 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  {plural(t.newsCount, news.length, lang)}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand">
                {localized(program, "name", lang)}
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{localized(program, "summary", lang)}</p>
              {bestPlaces[i].length > 0 && (
                // Our best place per league stage (details on the program's page).
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {bestPlaces[i].map(({ stage, place }) => (
                    <span key={stage} className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold-deep">
                      🏆 {fill(t.place, { stage: dict.league[stage], n: place })}
                    </span>
                  ))}
                </p>
              )}
              {(schedule || place) && (
                <dl className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  {schedule && (
                    <div className="flex gap-2"><dt className="w-16 shrink-0 text-slate-500">{t.when}</dt><dd className="font-medium">{schedule}</dd></div>
                  )}
                  {place && (
                    <div className="flex gap-2"><dt className="w-16 shrink-0 text-slate-500">{t.where}</dt><dd className="font-medium">{place}</dd></div>
                  )}
                </dl>
              )}
              <span className="mt-4 text-sm font-bold text-brand">
                {t.open} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.programs} intro={programs.length ? fill(t.countIntro, { n: programs.length }) : t.intro} kicker={dict.nav.events} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {programs.length ? (
          <>
            <StatTiles stats={stats} />
            {/* Search only pays off once there are a few projects. */}
            {programs.length > 3 ? (
              <CategoryFilter allLabel={`${dict.common.all} · ${programs.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={[]}>
                {cards}
              </CategoryFilter>
            ) : (
              cards
            )}
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
