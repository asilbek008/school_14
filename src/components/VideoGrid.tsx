import { mediaUrl } from "@/lib/content";

export type VideoItem = { id: number; kind: string; path: string };

/** Uploaded video files and YouTube videos (privacy-enhanced embed), two per row. */
export default function VideoGrid({ videos, title }: { videos: VideoItem[]; title: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((v) =>
        v.kind === "youtube" ? (
          <iframe
            key={v.id}
            src={`https://www.youtube-nocookie.com/embed/${v.path}`}
            title={title}
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
  );
}
