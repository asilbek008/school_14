import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getClubs, localized, mediaUrl, type Club } from "@/lib/content";
import { clubSchedule } from "@/lib/clubs";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/clubs">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.clubs.title };
}

// Grade bands for the filter chips: primary, middle and senior school.
const bands = [
  { key: "g1", from: 1, to: 4 },
  { key: "g5", from: 5, to: 9 },
  { key: "g10", from: 10, to: 11 },
];

/** The bands a club's grades overlap (every band when it has no grades set), as data-cat tokens. */
const bandsOf = (club: Club) =>
  bands.filter((b) => (club.grade_from ?? 1) <= b.to && (club.grade_to ?? 11) >= b.from).map((b) => b.key);

// Left edge color, in turn (as in the design mockup).
const accents = ["before:bg-brand", "before:bg-teal", "before:bg-gold"];

/** Clubs as in the design mockup: a colored left edge, name with the grades, description, then leader / time / place. */
export default async function ClubsPage({ params }: PageProps<"/[lang]/clubs">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.clubs;
  const clubs = await getClubs();
  const leaders = new Set(clubs.map((c) => c.staff?.full_name ?? c.leader).filter(Boolean)).size;
  const sessions = clubs.reduce((n, c) => n + (c.days?.length ?? 0), 0);
  const media = clubs.reduce((n, c) => n + c.club_media.length, 0);
  const stats = [
    { value: clubs.length, label: plural(t.statClubs, clubs.length, lang) },
    { value: leaders, label: plural(t.statLeaders, leaders, lang) },
    { value: sessions, label: t.statSessions },
    { value: media, label: t.statMedia },
  ];
  const options = bands
    .map((b) => ({ value: b.key, label: `${fill(t.grades, { from: b.from, to: b.to })} · ${clubs.filter((c) => bandsOf(c).includes(b.key)).length}` }))
    .filter((_, i) => clubs.some((c) => bandsOf(c).includes(bands[i].key)));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={t.title} intro={clubs.length ? fill(t.countIntro, { n: clubs.length }) : t.intro} kicker={t.kicker} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {clubs.length ? (
          <>
          <StatTiles stats={stats} />
          {/* Grade chips: a club shows under every band its grades overlap. */}
          <CategoryFilter allLabel={`${dict.common.all} · ${clubs.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const photo = mediaUrl(club.photo);
              const photos = club.club_media.filter((m) => m.kind === "photo").length;
              const videos = club.club_media.length - photos;
              const meta = [
                { label: t.leader, value: club.staff?.full_name ?? club.leader },
                { label: t.when, value: clubSchedule(club, dict.timetable.days) || localized(club, "schedule", lang) },
                { label: t.where, value: localized(club, "place", lang) },
              ].filter((m) => m.value);
              const q = [localized(club, "name", lang), ...meta.map((m) => m.value)].join(" ").toLowerCase();
              return (
                <article
                  key={club.id}
                  data-cat={bandsOf(club).join(" ")}
                  data-q={q}
                  style={{ animationDelay: `${(i % 6) * 60}ms` }}
                  className={`reveal lift group relative flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-[3px] hover:border-slate-300 ${accents[i % accents.length]}`}
                >
                  {photo && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image src={photo} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 ease-(--ease-spring) group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col px-[22px] pb-5 pt-[22px]">
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-slate-900">
                        {/* The whole card opens the club's page. */}
                        <Link href={`/${lang}/clubs/${club.id}`} className="transition-colors after:absolute after:inset-0 after:z-10 group-hover:text-brand">
                          {localized(club, "name", lang)}
                        </Link>
                      </h2>
                      {club.grade_from && club.grade_to && (
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-700">
                          {fill(t.grades, { from: club.grade_from, to: club.grade_to })}
                        </span>
                      )}
                    </div>
                    <p className="mb-3.5 flex-1 text-sm leading-relaxed text-slate-600">{localized(club, "description", lang)}</p>
                    {meta.length > 0 && (
                      // Labels in a column as wide as the longest one ("Руководитель" is wider than "Rahbari").
                      <dl className="grid grid-cols-[minmax(74px,auto)_1fr] gap-x-2 gap-y-[7px] border-t border-slate-200 pt-[13px] text-[13px]">
                        {meta.map(({ label, value }) => (
                          <div key={label} className="contents">
                            <dt className="text-slate-500">{label}</dt>
                            <dd className="font-semibold text-slate-700">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className="mt-4 flex items-center justify-between text-[13px]">
                      <span className="text-slate-500">
                        {photos > 0 && <span className="mr-3">📷 {photos}</span>}
                        {videos > 0 && <span>🎬 {videos}</span>}
                      </span>
                      <span className="font-bold text-brand">
                        {t.open} <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          </CategoryFilter>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
