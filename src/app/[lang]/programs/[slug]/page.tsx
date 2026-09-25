import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getLeagueTables, getNewsMentioning, getProgram, getRoundNewsPhotos, localized, mediaUrl } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { plural, fill } from "@/i18n/fill";
import PageHeader from "@/components/PageHeader";
import PhotoFrame from "@/components/PhotoFrame";
import RichText from "@/components/RichText";
import NewsCard from "@/components/NewsCard";
import EmptyState from "@/components/EmptyState";
import Lightbox from "@/components/Lightbox";
import VideoGrid from "@/components/VideoGrid";
import LeagueStandings from "@/components/LeagueStandings";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/programs/[slug]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const program = await getProgram((await params).slug);
  if (!program) return {};
  return { title: localized(program, "name", lang), description: localized(program, "summary", lang) };
}

export default async function ProgramPage({ params }: PageProps<"/[lang]/programs/[slug]">) {
  const { lang, dict } = await resolveLang(params);
  const program = await getProgram((await params).slug);
  if (!program) notFound();
  const t = dict.programs;
  const name = localized(program, "name", lang);
  const [news, league, newsRounds] = await Promise.all([
    program.keyword ? getNewsMentioning(program.keyword) : [],
    getLeagueTables(program.id),
    program.keyword ? getRoundNewsPhotos(program.keyword) : [],
  ]);
  const cover = mediaUrl(program.cover ?? news.find((n) => n.cover_image)?.cover_image ?? null);
  const schedule = localized(program, "schedule", lang);
  const place = localized(program, "place", lang);
  const photos = program.program_media.filter((m) => m.kind === "photo");
  const videos = program.program_media.filter((m) => m.kind !== "photo");
  // The photo gallery: one block per league round (uploaded here + photos of news about that round), newest first,
  // then the general photos.
  const roundNumbers = [...new Set([...photos.map((p) => p.round), ...newsRounds.map((r) => r.round)])].sort((a, b) => (b ?? 0) - (a ?? 0));
  const galleries = roundNumbers
    .map((round) => {
      const fromNews = newsRounds.find((r) => r.round === round);
      const paths = [...photos.filter((p) => p.round === round).map((p) => p.path), ...(fromNews?.paths ?? [])];
      return { round, date: fromNews?.date ?? null, photos: [...new Set(paths)].map((path) => mediaUrl(path)!) };
    })
    .filter((g) => g.photos.length);
  const photoTotal = galleries.reduce((n, g) => n + g.photos.length, 0);
  const lightboxT = { close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next };

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/programs`, label: dict.nav.programs },
        ]}
        title={name}
        intro={localized(program, "summary", lang)}
        kicker={dict.nav.programs}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {cover && <PhotoFrame src={cover} alt={name} priority className="mb-8 aspect-video rounded-3xl shadow-xl shadow-navy/10" />}
            <div className="text-lg">
              <RichText text={localized(program, "description", lang)} />
            </div>
          </div>
          {(schedule || place) && (
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-28">
              <dl className="space-y-4">
                {schedule && (
                  <div>
                    <dt className="text-sm text-slate-500">{t.when}</dt>
                    <dd className="font-bold text-slate-900">{schedule}</dd>
                  </div>
                )}
                {place && (
                  <div>
                    <dt className="text-sm text-slate-500">{t.where}</dt>
                    <dd className="font-bold text-slate-900">{place}</dd>
                  </div>
                )}
              </dl>
            </aside>
          )}
        </div>

        {league.length > 0 && (
          <section id="league" className="mt-14 scroll-mt-24">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
              <span className="relative flex size-2.5" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
              </span>
              {dict.league.online} · {dict.league.live}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-slate-900">{dict.league.title}</h2>
            <p className="mb-6 mt-1 text-slate-600">{dict.league.intro}</p>
            <LeagueStandings
              tables={league.map((x) => ({ stage: x.stage, title: x.title, asOf: x.as_of ? formatDate(x.as_of, lang) : null, rows: x.rows }))}
              t={dict.league}
            />
          </section>
        )}

        {galleries.length > 0 && (
          <section id="photos" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {t.gallery} <span className="font-semibold text-slate-400">· {photoTotal}</span>
            </h2>
            <p className="mb-6 mt-1 text-slate-600">{t.galleryIntro}</p>
            <div className="space-y-6">
              {galleries.map((g) => (
                <div key={g.round ?? "general"} id={g.round ? `round-${g.round}` : undefined} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {g.round ? (
                      <span className="rounded-full bg-navy px-3.5 py-1 text-sm font-bold text-white">{fill(t.roundGallery, { n: g.round })}</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3.5 py-1 text-sm font-bold text-slate-700">{t.generalGallery}</span>
                    )}
                    <span className="text-sm text-slate-500">
                      {plural(t.photoCount, g.photos.length, lang)}
                      {g.date && ` · ${formatDate(g.date, lang)}`}
                    </span>
                  </div>
                  <Lightbox photos={g.photos} alt={g.round ? `${name} — ${fill(t.roundGallery, { n: g.round })}` : name} t={lightboxT} layout="carousel" />
                </div>
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display mb-6 text-2xl font-bold tracking-tight text-slate-900">
              {t.videos} <span className="font-semibold text-slate-400">· {videos.length}</span>
            </h2>
            <VideoGrid videos={videos} title={name} />
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight text-slate-900">{t.related}</h2>
          {news.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} lang={lang} dict={dict} />
              ))}
            </div>
          ) : (
            <EmptyState>{t.noNews}</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
