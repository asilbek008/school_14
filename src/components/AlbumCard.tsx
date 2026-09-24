import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { albumCover, localized, mediaUrl, type Album } from "@/lib/content";
import { formatDate } from "@/lib/format";

/** Album card (as in the design mockup): cover with the photo count, title and date. */
export default function AlbumCard({ album, lang, dict }: { album: Album; lang: Locale; dict: Dictionary }) {
  const cover = mediaUrl(albumCover(album));
  return (
    <Link
      href={`/${lang}/gallery/${album.id}`}
      className="reveal lift group block overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)]"
    >
      <div className="relative h-[190px] overflow-hidden bg-gradient-to-br from-[#24345e] to-navy">
        {/* Shown when there is no cover (or under it while it loads). */}
        <svg viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M3.6 17.5l4.4-4.2 3.2 3 3-2.7 6.2 5.4" />
        </svg>
        {cover && (
          <Image src={cover} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 ease-(--ease-spring) group-hover:scale-105" />
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-[#111c3a]/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {fill(dict.gallery.photos, { n: album.gallery_photos.length })}
        </span>
      </div>
      <div className="px-[18px] pb-[18px] pt-4">
        <b className="font-display block text-[16.5px] leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-brand">
          {localized(album, "title", lang)}
        </b>
        <small className="mt-1 block text-[12.5px] text-slate-500">
          {album.event_date ? formatDate(album.event_date, lang) : dict.gallery.noDate}
        </small>
      </div>
    </Link>
  );
}
