import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { getAlbums, getClasses, getEvents, getNews } from "@/lib/content";
import AlbumCard from "@/components/AlbumCard";
import { currentSchoolYear, school } from "@/lib/school";
import entrance from "../../../public/images/school-entrance.webp";
import NewsCard from "@/components/NewsCard";
import EventItem from "@/components/EventItem";
import EmptyState from "@/components/EmptyState";
import EMaktabCard from "@/components/EMaktabCard";
import LiveCard from "@/components/LiveCard";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);
  const [news, { upcoming }, albums, classes] = await Promise.all([getNews(3), getEvents(), getAlbums(), getClasses()]);
  const recentAlbums = albums.filter((a) => a.gallery_photos.length > 0).slice(0, 3);
  const year = currentSchoolYear();
  // September: the year has just begun.
  const started = new Date().getMonth() === 8;
  const stats = [
    { value: school.stats.students, label: dict.home.statStudents, dot: "bg-[#6e9bff]" },
    { value: school.stats.staff, label: dict.home.statStaff, dot: "bg-[#3ecfb2]" },
    { value: classes.length || school.stats.classes, label: dict.home.statClasses, dot: "bg-gold" },
  ];
  const quick = [
    { key: "news", color: "bg-brand" },
    { key: "events", color: "bg-teal" },
    { key: "timetable", color: "bg-gold" },
    { key: "faq", color: "bg-[#c9553f]" },
  ] as const;

  return (
    <>
      <section className="chrome tricolor-rule">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="flex animate-fade-up flex-wrap items-center gap-2.5 text-[13.5px] font-semibold text-[#b9c4e2]">
              <span className="font-display rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                {year.from}–{year.to}
              </span>
              {started ? dict.home.eyebrowStarted : dict.home.eyebrow}
            </p>
            <h1 className="font-display mt-5 max-w-[15ch] animate-fade-up text-[clamp(2.25rem,5.1vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.032em] [animation-delay:80ms]">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-5 max-w-[48ch] animate-fade-up text-[17.5px] leading-relaxed text-[#c3cce6] [animation-delay:160ms]">{dict.home.heroLead}</p>
            <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link
                href={`/${lang}/timetable`}
                className="press rounded-full bg-gold px-[22px] py-[13px] text-[14.5px] font-bold text-[#241703] shadow-[0_12px_26px_-14px_rgb(217_148_42/0.9)] hover:bg-[#eba53c]"
              >
                {dict.home.ctaTimetable}
              </Link>
              <Link href={`/${lang}/news`} className="press rounded-full border-[1.5px] border-white/35 px-[22px] py-[13px] text-[14.5px] font-bold hover:border-white hover:bg-white/10">
                {dict.home.ctaNews}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md animate-fade-up grid-cols-3 gap-3 [animation-delay:320ms]">
              {stats.map(({ value, label, dot }) => (
                <div key={label} className="relative rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 transition duration-300 hover:border-white/30 hover:bg-white/[0.12]">
                  <span className={`absolute right-3 top-3.5 size-1.5 rounded-full ${dot}`} />
                  <dd className="text-2xl font-extrabold tracking-tight">{value}</dd>
                  <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <Image
            src={entrance}
            alt={dict.home.imageAlt}
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 500px, 100vw"
            className="aspect-square w-full animate-fade-in rounded-3xl object-cover shadow-2xl ring-1 ring-white/20 [animation-delay:200ms] lg:max-w-[500px] lg:justify-self-end"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">{dict.home.quickTitle}</h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <LiveCard t={dict.live} scheduleHref={`/${lang}/schedule`} />
          <div className="grid gap-4 sm:grid-cols-2">
            {quick.map(({ key, color }) => (
              <Link
                key={key}
                href={`/${lang}/${key}`}
                className="reveal lift group rounded-2xl border border-slate-200 bg-white p-5"
              >
                <span className={`mb-3 block h-1 w-10 rounded-full transition-[width] duration-500 ease-(--ease-spring) group-hover:w-16 ${color}`} />
                <b className="text-lg">{dict.nav[key]}</b>
                <p className="mt-1 text-sm text-slate-500">{dict.home.quick[key]}</p>
                <span className="mt-3 inline-grid size-8 place-items-center rounded-full bg-paper text-sm font-bold text-slate-600 transition duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <EMaktabCard t={dict.emaktab} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.latestNews}</h2>
          <Link href={`/${lang}/news`} className="group text-sm font-bold text-brand">
            {dict.home.allNews}{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        {news.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} dict={dict} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.news.empty}</EmptyState>
        )}
      </section>

      {recentAlbums.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">{dict.home.galleryTitle}</h2>
            <Link href={`/${lang}/gallery`} className="group text-sm font-bold text-brand">
              {dict.home.allPhotos}{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} lang={lang} dict={dict} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.upcomingEvents}</h2>
          <Link href={`/${lang}/events`} className="group text-sm font-bold text-brand">
            {dict.home.allEvents}{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.slice(0, 4).map((event) => (
              <EventItem key={event.id} event={event} lang={lang} dict={dict} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
        )}
      </section>
    </>
  );
}
