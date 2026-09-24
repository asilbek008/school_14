import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getClub, localized, mediaUrl } from "@/lib/content";
import { clubSchedule } from "@/lib/clubs";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import PhotoFrame from "@/components/PhotoFrame";
import Lightbox from "@/components/Lightbox";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/clubs/[id]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const club = await getClub(Number((await params).id));
  if (!club) return {};
  const cover = mediaUrl(club.photo);
  return { title: localized(club, "name", lang), openGraph: cover ? { images: [cover] } : undefined };
}

/** One club: description, when/where/who, and its photos and videos. */
export default async function ClubPage({ params }: PageProps<"/[lang]/clubs/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const club = await getClub(Number((await params).id));
  if (!club) notFound();
  const t = dict.clubs;
  const name = localized(club, "name", lang);
  const cover = mediaUrl(club.photo);
  const description = localized(club, "description", lang);
  const photos = club.media.filter((m) => m.kind === "photo").map((m) => mediaUrl(m.path)!);
  const videos = club.media.filter((m) => m.kind !== "photo");
  const schedule = clubSchedule(club, dict.timetable.days);
  const note = localized(club, "schedule", lang);
  const grades = club.grade_from && club.grade_to ? fill(t.grades, { from: club.grade_from, to: club.grade_to }) : null;

  const facts = [
    {
      label: t.leader,
      value: club.staff ? (
        <Link href={`/${lang}/staff/${club.staff.id}`} className="text-brand link-grow">
          {club.staff.full_name}
        </Link>
      ) : (
        club.leader
      ),
    },
    { label: t.when, value: schedule || note, sub: schedule ? note : null },
    { label: t.where, value: localized(club, "place", lang) },
    { label: t.gradesLabel, value: grades },
  ].filter((f) => f.value);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }, { href: `/${lang}/clubs`, label: t.title }]} kicker={t.kicker} title={name} intro={grades ?? undefined} />
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          <div>
            <Link href={`/${lang}/clubs`} className="group mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <span aria-hidden className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
              {t.back}
            </Link>
            {(cover || description) && (
              <article className="rounded-[14px] border border-slate-200 bg-white p-3.5 pb-7">
                {cover && <PhotoFrame src={cover} alt={name} priority className="mb-6 aspect-[16/9] rounded-xl" />}
                {description && (
                  <div className={`px-2.5 text-base leading-[1.8] sm:px-5 ${cover ? "" : "pt-3"}`}>
                    <RichText text={description} />
                  </div>
                )}
              </article>
            )}
          </div>

          {photos.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-xl font-bold tracking-tight text-slate-900">
                {t.photos} <span className="font-semibold text-slate-400">· {photos.length}</span>
              </h2>
              <Lightbox photos={photos} alt={name} t={{ close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next }} />
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-xl font-bold tracking-tight text-slate-900">
                {t.videos} <span className="font-semibold text-slate-400">· {videos.length}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {videos.map((v) =>
                  v.kind === "youtube" ? (
                    <iframe
                      key={v.id}
                      src={`https://www.youtube-nocookie.com/embed/${v.path}`}
                      title={name}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="aspect-video w-full rounded-[14px] border border-slate-200 bg-black"
                    />
                  ) : (
                    <video key={v.id} src={mediaUrl(v.path)!} controls preload="metadata" playsInline className="aspect-video w-full rounded-[14px] border border-slate-200 bg-black" />
                  ),
                )}
              </div>
            </section>
          )}
        </div>

        {facts.length > 0 && (
          <aside className="rounded-[14px] border border-slate-200 bg-white px-6 py-5 lg:sticky lg:top-24 lg:mt-[38px]">
            <dl>
              {facts.map((f) => (
                <div key={f.label} className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                  <dt className="text-xs font-bold text-slate-500">{f.label}</dt>
                  <dd className="font-display mt-1 font-bold text-slate-900">{f.value}</dd>
                  {f.sub && <dd className="mt-0.5 text-sm text-slate-500">{f.sub}</dd>}
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>
    </>
  );
}
