import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getEvents } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EventItem from "@/components/EventItem";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/events">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.events };
}

export default async function EventsPage({ params }: PageProps<"/[lang]/events">) {
  const { lang, dict } = await resolveLang(params);
  const { upcoming, past } = await getEvents();

  return (
    <>
      <PageHeader title={dict.nav.events} />
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-10">
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{dict.events.upcoming}</h2>
          {upcoming.length ? (
            <div className="space-y-4">
              {upcoming.map((event) => (
                <EventItem key={event.id} event={event} lang={lang} locationLabel={dict.events.location} />
              ))}
            </div>
          ) : (
            <EmptyState>{dict.events.emptyUpcoming}</EmptyState>
          )}
        </section>
        {past.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{dict.events.past}</h2>
            <div className="space-y-4 opacity-80">
              {past.map((event) => (
                <EventItem key={event.id} event={event} lang={lang} locationLabel={dict.events.location} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
