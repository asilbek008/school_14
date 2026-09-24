import { mediaBaseUrl } from "@/lib/media";
import DeleteButton from "./DeleteButton";

/** Admin previews of uploaded video files and YouTube links, each with a delete button. */
export default function VideoList({
  videos,
  remove,
}: {
  videos: { id: number; kind: string; path: string }[];
  remove: (id: number) => () => Promise<void>;
}) {
  if (!videos.length) return null;
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <li key={v.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
          {v.kind === "youtube" ? (
            // eslint-disable-next-line @next/next/no-img-element -- YouTube preview frame
            <img src={`https://i.ytimg.com/vi/${v.path}/hqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full bg-slate-900 object-cover" />
          ) : (
            <video src={`${mediaBaseUrl}/${v.path}`} controls preload="metadata" className="aspect-video w-full bg-slate-900" />
          )}
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-slate-500">{v.kind === "youtube" ? "YouTube" : "Video fayl"}</span>
            <DeleteButton action={remove(v.id)} confirmText="Bu videoni o‘chirasizmi?" />
          </div>
        </li>
      ))}
    </ul>
  );
}
