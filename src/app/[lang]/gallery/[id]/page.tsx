import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { albumCover, getAlbum, localized, mediaUrl } from "@/lib/content";
import { formatDate } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import Lightbox from "@/components/Lightbox";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery/[id]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const album = await getAlbum(Number((await params).id));
  if (!album) return {};
  const cover = mediaUrl(albumCover(album));
  return { title: localized(album, "title", lang), openGraph: cover ? { images: [cover] } : undefined };
}

export default async function AlbumPage({ params }: PageProps<"/[lang]/gallery/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const album = await getAlbum(Number((await params).id));
  if (!album) notFound();
  const title = localized(album, "title", lang);
  const description = localized(album, "description", lang);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }, { href: `/${lang}/gallery`, label: dict.nav.gallery }]} title={title} kicker={album.event_date ? formatDate(album.event_date, lang) : dict.nav.gallery} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href={`/${lang}/gallery`} className="text-sm font-bold text-brand link-grow">
          ← {dict.gallery.back}
        </Link>
        {description && (
          <div className="mt-4 max-w-3xl">
            <RichText text={description} />
          </div>
        )}
        <div className="mt-6">
          <Lightbox
            photos={album.gallery_photos.map((p) => mediaUrl(p.path)!)}
            alt={title}
            t={{ close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next }}
          />
        </div>
      </div>
    </>
  );
}
