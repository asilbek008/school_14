import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { videoColors } from "@/lib/categories";
import { getVideo, getVideos, localized, mediaUrl } from "@/lib/content";
import { formatDate } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import VideoCard, { videoPoster } from "@/components/VideoCard";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/videos/[id]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const video = await getVideo(Number((await params).id));
  if (!video) return { title: dict.videos.title };
  return { title: localized(video, "title", lang), description: localized(video, "description", lang) || dict.videos.intro };
}

/** One video with its player, description, and the other videos below it. */
export default async function VideoPage({ params }: PageProps<"/[lang]/videos/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const id = Number((await params).id);
  const video = await getVideo(id);
  if (!video) notFound();
  const t = dict.videos;
  const title = localized(video, "title", lang);
  const description = localized(video, "description", lang);
  const others = (await getVideos()).filter((v) => v.id !== video.id).slice(0, 3);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/videos`, label: t.title },
        ]}
        kicker={t.cats[video.category]}
        title={title}
        intro={video.recorded_on ? formatDate(video.recorded_on, lang) : undefined}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        {video.kind === "youtube" ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.path}`}
            title={title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full rounded-[14px] border border-slate-200 bg-black"
          />
        ) : (
          <video
            src={mediaUrl(video.path)!}
            poster={videoPoster(video) ?? undefined}
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full rounded-[14px] border border-slate-200 bg-black"
          />
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${videoColors[video.category]}`}>{t.cats[video.category]}</span>
          <span className="text-[13px] text-slate-500">{video.recorded_on ? formatDate(video.recorded_on, lang) : t.noDate}</span>
          {video.kind === "youtube" && (
            <a
              href={`https://www.youtube.com/watch?v=${video.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[13.5px] font-bold text-brand-deep link-grow"
            >
              {t.onYoutube} ↗
            </a>
          )}
        </div>

        {description && (
          <div className="mt-5 rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6">
            <RichText text={description} />
          </div>
        )}

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">{t.related}</h2>
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {others.map((v) => (
                <VideoCard key={v.id} video={v} lang={lang} dict={dict} />
              ))}
            </div>
            <Link href={`/${lang}/videos`} className="mt-5 inline-block text-[13.5px] font-bold text-brand-deep link-grow">
              ← {t.title}
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
