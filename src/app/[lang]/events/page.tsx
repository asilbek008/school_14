import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getEvents } from "@/lib/content";
import { eventCategories } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import { fill } from "@/i18n/fill";
import { currentSchoolYear } from "@/lib/school";
import EventItem from "@/components/EventItem";
import EmptyState from "@/components/EmptyState";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/events">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.events };
}

export default async function EventsPage({ params }: PageProps<"/[lang]/events">) {
  const { lang, dict } = await resolveLang(params);
  const { upcoming, past } = await getEvents();
  const all = [...upcoming, ...past];
  const present = eventCategories.filter((c) => all.some((e) => e.category === c));
  const heading = (text: string, count: number) => (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
      {text}
      <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-deep">{count}</span>
    </h2>
  );

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.events} intro={dict.events.intro} kicker={fill(dict.topbar.year, currentSchoolYear())} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <CategoryFilter
          allLabel={dict.common.all}
          options={present.map((c) => ({ value: c, label: dict.eventCats[c] }))}
        >
          <section id="upcoming" className="scroll-mt-24">
            {heading(dict.events.upcoming, upcoming.length)}
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventItem key={event.id} event={event} lang={lang} dict={dict} />
                ))}
              </div>
            ) : (
              <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
            )}
          </section>
          {past.length > 0 && (
            <section id="past" className="mt-12 scroll-mt-24">
              {heading(dict.events.past, past.length)}
              <div className="space-y-3">
                {past.map((event) => (
                  <EventItem key={event.id} event={event} lang={lang} dict={dict} past />
                ))}
              </div>
            </section>
          )}
        </CategoryFilter>
        <p className="mt-8 text-[13px] text-slate-500">{dict.events.note}</p>
      </div>
    </>
  );
}
