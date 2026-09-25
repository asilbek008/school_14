import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { getAlbums, getClasses, getClubs, getEvents, getNews, getPrograms, getStudentTotal, getTests, mediaUrl } from "@/lib/content";
import Lightbox from "@/components/Lightbox";
import { currentSchoolYear, school } from "@/lib/school";
import entrance from "../../../public/images/school-entrance.webp";
import NewsCard from "@/components/NewsCard";
import EventCard from "@/components/EventCard";
import SectionHead from "@/components/SectionHead";
import EmptyState from "@/components/EmptyState";
import EMaktabCard from "@/components/EMaktabCard";
import TestsCard from "@/components/TestsCard";
import LiveCard from "@/components/LiveCard";
import StatTiles from "@/components/StatTiles";
import MyClassCard from "@/components/MyClassCard";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);
  const [allNews, { upcoming }, albums, classes, clubs, programs, tests, students] = await Promise.all([
    getNews(),
    getEvents(),
    getAlbums(),
    getClasses(),
    getClubs(),
    getPrograms(),
    getTests(),
    getStudentTotal(),
  ]);
  const news = allNews.slice(0, 3);
  // "School life in numbers": each tile opens its section.
  const numbers = [
    { value: allNews.length, label: plural(dict.home.numNews, allNews.length, lang), href: `/${lang}/news` },
    { value: upcoming.length, label: dict.home.numEvents, href: `/${lang}/events` },
    { value: clubs.length, label: plural(dict.home.numClubs, clubs.length, lang), href: `/${lang}/clubs` },
    { value: programs.length, label: dict.home.numPrograms, href: `/${lang}/programs` },
  ];
  const recentPhotos = albums.flatMap((a) => a.gallery_photos.map((p) => mediaUrl(p.path)!)).slice(0, 4);
  const year = currentSchoolYear();
  // September: the year has just begun.
  const started = new Date().getMonth() === 8;
  const stats = [
    { value: students, label: dict.home.statStudents, dot: "bg-[#6e9bff]" },
    { value: school.stats.staff, label: dict.home.statStaff, dot: "bg-[#3ecfb2]" },
    { value: classes.length || school.stats.classes, label: dict.home.statClasses, dot: "bg-gold" },
  ];
  // Quick access cards (from the design mockup): icon tint, and the icon's SVG paths.
  const quick = [
    { key: "timetable", tint: "bg-brand-soft text-brand-deep", icon: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" /></> },
    { key: "news", tint: "bg-teal-soft text-[#0c6d62]", icon: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v8a2 2 0 0 1-2 2" /><path d="M7.5 9h6M7.5 12.5h6M7.5 16h4" /></> },
    { key: "events", tint: "bg-gold-soft text-gold-deep", icon: <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></> },
    { key: "faq", tint: "bg-[#fae7e2] text-[#c9553f]", icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></> },
  ] as const;

  return (
    <>
      <section className="chrome tricolor-rule">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.3fr_0.7fr] 2xl:max-w-7xl 2xl:gap-14">
          <div>
            <p className="flex animate-fade-up flex-wrap items-center gap-2.5 text-[13.5px] font-semibold text-[#b9c4e2] xl:text-base">
              <span className="font-display rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white xl:px-3.5 xl:text-sm">
                {year.from}–{year.to}
              </span>
              {started ? dict.home.eyebrowStarted : dict.home.eyebrow}
            </p>
            <h1 className="font-display mt-5 animate-fade-up text-[clamp(2rem,4vw,3rem)] font-bold xl:text-[3.5rem] 2xl:text-[3.75rem] leading-[1.08] tracking-[-0.032em] [animation-delay:80ms]">
              {/* One sentence per line, so the motto does not break mid-thought. */}
              {dict.home.heroTitle.split(/(?<=\.)\s+/).map((sentence) => (
                <span key={sentence} className="block">
                  {sentence}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-[52ch] animate-fade-up text-[17.5px] leading-relaxed xl:mt-6 xl:text-xl text-[#c3cce6] [animation-delay:160ms]">{dict.home.heroLead}</p>
            <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link
                href={`/${lang}/timetable`}
                className="press rounded-full bg-gold px-[22px] py-[13px] text-[14.5px] font-bold text-[#241703] xl:px-7 xl:py-4 xl:text-base shadow-[0_12px_26px_-14px_rgb(217_148_42/0.9)] hover:bg-[#eba53c]"
              >
                {dict.home.ctaTimetable}
              </Link>
              <Link href={`/${lang}/news`} className="press rounded-full border-[1.5px] border-white/35 px-[22px] py-[13px] text-[14.5px] font-bold xl:px-7 xl:py-4 xl:text-base hover:border-white hover:bg-white/10">
                {dict.home.ctaNews}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md animate-fade-up xl:max-w-xl grid-cols-3 gap-3 [animation-delay:320ms]">
              {stats.map(({ value, label, dot }) => (
                <div key={label} className="relative rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 transition duration-300 hover:border-white/30 xl:px-5 xl:py-4 hover:bg-white/[0.12]">
                  <span className={`absolute right-3 top-3.5 size-1.5 rounded-full ${dot}`} />
                  <dd className="text-2xl font-extrabold tracking-tight xl:text-[1.9rem]">{value}</dd>
                  <dt className="text-xs font-semibold text-slate-400 xl:text-sm">{label}</dt>
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
            className="aspect-square w-full animate-fade-in rounded-3xl object-cover shadow-2xl ring-1 ring-white/20 [animation-delay:200ms] lg:max-w-[460px] lg:justify-self-end"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <SectionHead kicker={dict.home.quickKicker} title={dict.home.quickTitle} />
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <LiveCard t={dict.live} scheduleHref={`/${lang}/schedule`} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            {quick.map(({ key, tint, icon }) => (
              <Link
                key={key}
                href={`/${lang}/${key}`}
                className="reveal lift group relative flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-5 pb-[60px] hover:border-slate-300"
              >
                <span className={`mb-3 grid size-11 place-items-center rounded-[13px] transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-6 group-hover:scale-105 ${tint}`}>
                  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {icon}
                  </svg>
                </span>
                <b className="font-display text-[16.5px] tracking-tight text-slate-900">{dict.nav[key]}</b>
                <span className="text-[13.5px] leading-snug text-slate-500">{dict.home.quick[key]}</span>
                <span className="absolute bottom-4 left-5 grid size-8 place-items-center rounded-full bg-paper text-slate-600 transition duration-300 group-hover:translate-x-1.5 group-hover:bg-brand group-hover:text-white">
                  <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
        {/* The visitor's own class, if they picked one (browser only). */}
        <div className="mt-4">
          <MyClassCard lang={lang} t={dict.myClass} days={dict.timetable.days} />
        </div>
        <div className="mt-4">
          <EMaktabCard t={dict.emaktab} />
        </div>
        {tests.length > 0 && (
          <div className="mt-4">
            <TestsCard lang={lang} t={dict.tests} />
          </div>
        )}
      </section>

      {/* Sections are divided by a hairline, as in the design mockup. */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <SectionHead kicker={dict.home.numbersKicker} title={dict.home.numbersTitle} />
          <StatTiles stats={numbers} className="" />
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <SectionHead kicker={dict.nav.news} title={dict.home.latestNews} action={{ href: `/${lang}/news`, label: dict.home.allNews }} />
        {news.length ? (
          // The newest article large on the left, the next two as compact rows beside it.
          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
            {news.map((item, i) => (
              <NewsCard key={item.id} item={item} lang={lang} dict={dict} layout={i === 0 ? "tall" : "row"} />
            ))}
          </div>
        ) : (
          <EmptyState>{dict.news.empty}</EmptyState>
        )}
        </div>
      </section>

      {recentPhotos.length >= 2 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <SectionHead kicker={dict.nav.gallery} title={dict.home.galleryTitle} action={{ href: `/${lang}/gallery`, label: dict.home.allPhotos }} />
          {/* The newest photos across albums; a click opens them full screen. */}
          <Lightbox
            photos={recentPhotos}
            alt={dict.home.galleryTitle}
            gridClassName="grid-cols-2 md:grid-cols-4"
            t={{ close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next }}
          />
          </div>
        </section>
      )}

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <SectionHead kicker={dict.nav.events} title={dict.home.upcomingEvents} action={{ href: `/${lang}/events`, label: dict.home.allEvents }} />
          {upcoming.length ? (
            // Compact cards (as in the design mockup); the events page has the details.
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} lang={lang} dict={dict} />
              ))}
            </div>
          ) : (
            <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
