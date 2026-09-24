import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getAlbums } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import AlbumCard from "@/components/AlbumCard";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.gallery };
}

export default async function GalleryPage({ params }: PageProps<"/[lang]/gallery">) {
  const { lang, dict } = await resolveLang(params);
  const albums = (await getAlbums()).filter((a) => a.gallery_photos.length > 0);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.gallery} intro={dict.gallery.intro} kicker={dict.home.galleryTitle} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {albums.length ? (
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} lang={lang} dict={dict} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.gallery.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
