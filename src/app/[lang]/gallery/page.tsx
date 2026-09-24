import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getAlbums, localized } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import AlbumCard from "@/components/AlbumCard";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.gallery.title };
}

/** The school year (from September) an album's date falls in: "2026" for 2026–2027; "none" when undated. */
const schoolYearOf = (date: string | null) => {
  if (!date) return "none";
  const [y, m] = date.split("-").map(Number);
  return String(m >= 8 ? y : y - 1);
};

export default async function GalleryPage({ params }: PageProps<"/[lang]/gallery">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.gallery;
  const albums = (await getAlbums()).filter((a) => a.gallery_photos.length + a.gallery_videos.length > 0);
  const photos = albums.reduce((n, a) => n + a.gallery_photos.length, 0);
  const videos = albums.reduce((n, a) => n + a.gallery_videos.length, 0);

  // Year chips (newest first, undated last), only when the albums span more than one.
  const years = [...new Set(albums.map((a) => schoolYearOf(a.event_date)))].sort((a, b) => (a === "none" ? 1 : b === "none" ? -1 : Number(b) - Number(a)));
  const count = (y: string) => albums.filter((a) => schoolYearOf(a.event_date) === y).length;
  const options =
    years.length > 1
      ? years.map((y) => ({
          value: y,
          label: `${y === "none" ? t.undated : fill(t.schoolYear, { from: Number(y), to: Number(y) + 1 })} · ${count(y)}`,
        }))
      : [];

  const stats = [
    { value: albums.length, label: plural(t.statAlbums, albums.length, lang) },
    { value: photos, label: plural(t.statPhotos, photos, lang) },
    { value: videos, label: plural(t.statVideos, videos, lang) },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        title={t.title}
        intro={albums.length ? fill(t.countIntro, { n: albums.length }) : t.intro}
        kicker={dict.home.galleryTitle}
      />
      <div className="year-scope mx-auto max-w-6xl px-4 py-10">
        {albums.length ? (
          <>
            <StatTiles stats={stats} />
            <CategoryFilter allLabel={`${dict.common.all} · ${albums.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
              <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                  <div key={album.id} data-cat={schoolYearOf(album.event_date)} data-year={schoolYearOf(album.event_date)} data-q={localized(album, "title", lang).toLowerCase()}>
                    <AlbumCard album={album} lang={lang} dict={dict} />
                  </div>
                ))}
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
