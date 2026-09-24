import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill, plural } from "@/i18n/fill";
import { getAlbums, localized } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
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
    { value: albums.length, label: plural(t.statAlbums, albums.length, lang), bg: "from-[#3e72e8] to-brand-deep" },
    { value: photos, label: plural(t.statPhotos, photos, lang), bg: "from-[#17a090] to-[#0c6d62]" },
    { value: videos, label: plural(t.statVideos, videos, lang), bg: "from-[#e0a33e] to-gold-deep" },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        title={t.title}
        intro={albums.length ? fill(t.countIntro, { n: albums.length }) : t.intro}
        kicker={dict.home.galleryTitle}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {albums.length ? (
          <>
            {/* Totals, as colored tiles (as on "About"). */}
            <div className="mb-8 grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {stats.map(({ value, label, bg }, i) => (
                <div
                  key={label}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`reveal relative overflow-hidden rounded-[14px] bg-gradient-to-br px-3.5 py-4 text-white after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 sm:px-5 sm:py-5 ${bg}`}
                >
                  <b className="font-display block text-2xl font-extrabold leading-none tracking-tight sm:text-[30px]">{value}</b>
                  <span className="mt-1.5 block text-[12.5px] font-semibold opacity-90 sm:text-[13.5px]">{label}</span>
                </div>
              ))}
            </div>
            <CategoryFilter allLabel={`${dict.common.all} · ${albums.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
              <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                  <div key={album.id} data-cat={schoolYearOf(album.event_date)} data-q={localized(album, "title", lang).toLowerCase()}>
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
