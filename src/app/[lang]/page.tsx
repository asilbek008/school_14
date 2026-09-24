import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { getAlbums, getClasses, getEvents, getNews, mediaUrl } from "@/lib/content";
import Lightbox from "@/components/Lightbox";
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
  const recentPhotos = albums.flatMap((a) => a.gallery_photos.map((p) => mediaUrl(p.path)!)).slice(0, 4);
  const year = currentSchoolYear();
  // September: the year has just begun.
  const started = new Date().getMonth() === 8;
  const stats = [
    { value: school.stats.students, label: dict.home.statStudents, dot: "bg-[#6e9bff]" },
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
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="flex animate-fade-up flex-wrap items-center gap-2.5 text-[13.5px] font-semibold text-[#b9c4e2]">
              <span className="font-display rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                {year.from}–{year.to}
              </span>
              {started ? dict.home.eyebrowStarted : dict.home.eyebrow}
            </p>
            <h1 className="font-display mt-5 max-w-[22ch] animate-fade-up text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.032em] [animation-delay:80ms]">
              {/* One sentence per line, so the motto does not break mid-thought. */}
              {dict.home.heroTitle.split(/(?<=\.)\s+/).map((sentence) => (
                <span key={sentence} className="block">
                  {sentence}
                </span>
              ))}
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
        <p className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#0c6d62] before:h-0.5 before:w-[18px] before:rounded before:bg-gold">
          {dict.home.quickKicker}
        </p>
        <h2 className="font-display mb-7 text-[clamp(1.6rem,2.9vw,2.1rem)] font-bold tracking-tight text-slate-900">{dict.home.quickTitle}</h2>
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
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <EMaktabCard t={dict.emaktab} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#0c6d62] before:h-0.5 before:w-[18px] before:rounded before:bg-gold">
              {dict.nav.news}
            </p>
            <h2 className="font-display text-[clamp(1.6rem,2.9vw,2.1rem)] font-bold tracking-tight text-slate-900">{dict.home.latestNews}</h2>
          </div>
          <Link
            href={`/${lang}/news`}
            className="press rounded-full border-[1.5px] border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:border-brand hover:text-brand"
          >
            {dict.home.allNews}
          </Link>
        </div>
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
      </section>

      {recentPhotos.length >= 2 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#0c6d62] before:h-0.5 before:w-[18px] before:rounded before:bg-gold">
                {dict.nav.gallery}
              </p>
              <h2 className="font-display text-[clamp(1.6rem,2.9vw,2.1rem)] font-bold tracking-tight text-slate-900">{dict.home.galleryTitle}</h2>
            </div>
            <Link
              href={`/${lang}/gallery`}
              className="press rounded-full border-[1.5px] border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:border-brand hover:text-brand"
            >
              {dict.home.allPhotos}
            </Link>
          </div>
          {/* The newest photos across albums; a click opens them full screen. */}
          <Lightbox
            photos={recentPhotos}
            alt={dict.home.galleryTitle}
            gridClassName="grid-cols-2 md:grid-cols-4"
            t={{ close: dict.gallery.close, prev: dict.gallery.prev, next: dict.gallery.next }}
          />
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
