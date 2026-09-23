import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { albumCover, localized, mediaUrl, type Album } from "@/lib/content";
import { formatDate } from "@/lib/format";

export default function AlbumCard({ album, lang, dict }: { album: Album; lang: Locale; dict: Dictionary }) {
  const cover = mediaUrl(albumCover(album));
  return (
    <Link
      href={`/${lang}/gallery/${album.id}`}
      className="reveal lift group block overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#24345e] to-navy">
        {cover && (
          <Image src={cover} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition duration-700 ease-(--ease-spring) group-hover:scale-105" />
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {fill(dict.gallery.photos, { n: album.gallery_photos.length })}
        </span>
      </div>
      <div className="p-4">
        <b className="block leading-snug transition-colors group-hover:text-brand">{localized(album, "title", lang)}</b>
        {album.event_date && <small className="text-slate-500">{formatDate(album.event_date, lang)}</small>}
      </div>
    </Link>
  );
}
