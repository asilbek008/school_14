import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { videoColors } from "@/lib/categories";
import { localized, mediaUrl, type SchoolVideo } from "@/lib/content";
import { youtubeThumb } from "@/lib/media";
import { formatDate } from "@/lib/format";

/** The still shown before a video plays: YouTube's own thumbnail, or the poster an admin uploaded. */
export const videoPoster = (video: SchoolVideo) =>
  video.kind === "youtube" ? youtubeThumb(video.path) : video.cover ? mediaUrl(video.cover) : null;

/** One video in the list: its still with a play badge, category, title and date. */
export default function VideoCard({ video, lang, dict }: { video: SchoolVideo; lang: Locale; dict: Dictionary }) {
  const poster = videoPoster(video);
  const t = dict.videos;

  return (
    <Link
      href={`/${lang}/videos/${video.id}`}
      className="lift group flex h-full flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-navy">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- YouTube's thumbnail host is not in next/image's allow list
          <img src={poster} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : null}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur-sm transition group-hover:bg-black/65"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${videoColors[video.category]}`}>{t.cats[video.category]}</span>
          <span className="text-[12.5px] text-slate-500">{video.recorded_on ? formatDate(video.recorded_on, lang) : t.noDate}</span>
        </div>
        <h3 className="text-[16px] font-bold leading-snug text-slate-900">{localized(video, "title", lang)}</h3>
      </div>
    </Link>
  );
}
