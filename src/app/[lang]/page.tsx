import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { getEvents, getNews } from "@/lib/content";
import { school } from "@/lib/school";
import entrance from "../../../public/images/school-entrance.webp";
import NewsCard from "@/components/NewsCard";
import EventItem from "@/components/EventItem";
import EmptyState from "@/components/EmptyState";
import LiveCard from "@/components/LiveCard";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);
  const [news, { upcoming }] = await Promise.all([getNews(3), getEvents()]);
  const stats = [
    { value: school.stats.students, label: dict.home.statStudents, dot: "bg-[#6e9bff]" },
    { value: school.stats.staff, label: dict.home.statStaff, dot: "bg-[#3ecfb2]" },
    { value: school.stats.classes, label: dict.home.statClasses, dot: "bg-gold" },
  ];
  const quick = [
    { key: "news", color: "bg-brand" },
    { key: "events", color: "bg-teal" },
    { key: "schedule", color: "bg-gold" },
    { key: "faq", color: "bg-[#c9553f]" },
  ] as const;

  return (
    <>
      <section className="chrome tricolor-rule">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
              {school.foundedLabel[lang]}
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{dict.home.welcome}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">{dict.home.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/admissions`} className="rounded-full bg-gold px-6 py-3 font-bold text-[#241703] shadow-lg hover:bg-[#eba53c]">
                {dict.home.ctaAdmissions}
              </Link>
              <Link href={`/${lang}/contact`} className="rounded-full border border-white/35 px-6 py-3 font-bold hover:bg-white/10">
                {dict.home.ctaContact}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {stats.map(({ value, label, dot }) => (
                <div key={label} className="relative rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3">
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
            className="aspect-square w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/20 lg:max-w-[500px] lg:justify-self-end"
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
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`mb-3 block h-1 w-10 rounded-full ${color}`} />
                <b className="text-lg">{dict.nav[key]}</b>
                <p className="mt-1 text-sm text-slate-500">{dict.home.quick[key]}</p>
                <span className="mt-3 inline-block text-sm font-bold text-brand transition group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.latestNews}</h2>
          <Link href={`/${lang}/news`} className="text-sm font-medium text-brand hover:underline">
            {dict.home.allNews} →
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

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{dict.home.upcomingEvents}</h2>
          <Link href={`/${lang}/events`} className="text-sm font-medium text-brand hover:underline">
            {dict.home.allEvents} →
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
