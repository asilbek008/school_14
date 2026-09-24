import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getEvents, type SchoolEvent } from "@/lib/content";
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
  // Count pill that follows the chosen category, and a note for a category with nothing in the group
  // (CategoryFilter shows the data-cat-only one of the chosen chip; "__all" hides while one is chosen).
  const heading = (text: string, list: SchoolEvent[]) => (
    <h2 className="font-display mb-4 flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900">
      {text}
      <span data-cat="__all" className="rounded-full bg-brand-soft px-2.5 py-0.5 font-sans text-xs font-bold text-brand-deep">
        {list.length}
      </span>
      {present.map((c) => (
        <span key={c} data-cat-only={c} className="hidden rounded-full bg-brand-soft px-2.5 py-0.5 font-sans text-xs font-bold text-brand-deep">
          {list.filter((e) => e.category === c).length}
        </span>
      ))}
    </h2>
  );
  const noneOfType = (list: SchoolEvent[]) =>
    present
      .filter((c) => !list.some((e) => e.category === c))
      .map((c) => (
        <p key={c} data-cat-only={c} className="hidden rounded-[14px] border-[1.5px] border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
          {dict.events.noneOfType}
        </p>
      ));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.events} intro={dict.events.intro} kicker={fill(dict.topbar.year, currentSchoolYear())} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <CategoryFilter
          allLabel={dict.common.all}
          options={present.map((c) => ({ value: c, label: dict.eventCats[c] }))}
        >
          <section id="upcoming" className="scroll-mt-24">
            {heading(dict.events.upcoming, upcoming)}
            {upcoming.length ? (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventItem key={event.id} event={event} lang={lang} dict={dict} />
                ))}
                {noneOfType(upcoming)}
              </div>
            ) : (
              <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
            )}
          </section>
          {past.length > 0 && (
            <section id="past" className="mt-12 scroll-mt-24">
              {heading(dict.events.past, past)}
              <div className="space-y-3">
                {past.map((event) => (
                  <EventItem key={event.id} event={event} lang={lang} dict={dict} past />
                ))}
                {noneOfType(past)}
              </div>
            </section>
          )}
        </CategoryFilter>
        <p className="mt-8 text-[13px] text-slate-500">{dict.events.note}</p>
      </div>
    </>
  );
}
