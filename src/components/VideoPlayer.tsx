import type { Dictionary } from "@/i18n/dictionaries";
import { mediaUrl, type SchoolVideo } from "@/lib/content";
import { videoPoster } from "./VideoCard";

/**
 * One video, played the way its source allows: a YouTube embed (no cookies), a file from our own
 * bucket, or -- for a channel video Telegram will not hand over, because it is too big for both the
 * preview page and the Bot API -- its own frame with a button that opens the post. The third case is
 * not a failure to hide: the video exists, it just lives in Telegram, and saying so is more use to a
 * parent than an empty player.
 */
export default function VideoPlayer({ video, title, dict }: { video: SchoolVideo; title: string; dict: Dictionary }) {
  const t = dict.videos;
  const frame = "aspect-video w-full rounded-[14px] border border-slate-200 bg-black";

  if (video.kind === "youtube") {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video.path}`}
        title={title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className={frame}
      />
    );
  }

  if (video.kind === "file") {
    return (
      <video
        src={mediaUrl(video.path)!}
        poster={videoPoster(video) ?? undefined}
        controls
        preload="metadata"
        playsInline
        className={frame}
      />
    );
  }

  const poster = videoPoster(video);
  return (
    <a
      href={video.source_url ?? `https://t.me/${video.path}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative grid place-items-center overflow-hidden ${frame}`}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- Telegram's frame, already in our bucket
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-55 transition group-hover:opacity-70" />
      )}
      <span className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-white/25">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-7" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="text-[15px] font-bold text-white drop-shadow">{t.onTelegram} ↗</span>
        <span className="max-w-sm text-[12.5px] leading-relaxed text-white/80 drop-shadow">{t.tooBig}</span>
      </span>
    </a>
  );
}
