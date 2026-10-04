import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { videoCategories } from "@/lib/categories";
import { getVideos, localized } from "@/lib/content";
import { currentSchoolYear } from "@/lib/school";
import { itemYear } from "@/lib/school-years";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";
import VideoCard from "@/components/VideoCard";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/videos">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.videos.title, description: dict.videos.intro };
}

/** The video section: event clips, open lessons and club recordings, each on its own page. */
export default async function VideosPage({ params }: PageProps<"/[lang]/videos">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.videos;
  const videos = await getVideos();
  const year = currentSchoolYear().from;
  const count = (category: string) => videos.filter((v) => v.category === category).length;

  const stats = [
    { value: videos.length, label: t.stats.all },
    { value: videos.filter((v) => itemYear(v.school_year, v.recorded_on) === year).length, label: t.stats.year },
    { value: count("tadbir"), label: t.stats.events },
    { value: count("dars"), label: t.stats.lessons },
  ];

  const options = videoCategories.filter((c) => count(c)).map((c) => ({ value: c, label: `${t.cats[c]} · ${count(c)}` }));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="year-scope mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {videos.length ? (
          <>
            <StatTiles stats={stats} />
            <CategoryFilter allLabel={`${t.all} · ${videos.length}`} searchLabel={t.search} emptyLabel={t.emptyFiltered} options={options}>
              <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="reveal"
                    data-cat={video.category}
                    data-year={itemYear(video.school_year, video.recorded_on) ?? ""}
                    data-q={localized(video, "title", lang).toLowerCase()}
                  >
                    <VideoCard video={video} lang={lang} dict={dict} />
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
