import type { Metadata } from "next";
import { Suspense } from "react";
import { resolveLang } from "@/i18n/server";
import { getAlbums, getClubs, getEvents, getNews, getPrograms, getStaff, localized } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { positionLabel } from "@/lib/positions";
import PageHeader from "@/components/PageHeader";
import SiteSearch, { type SearchItem } from "@/components/SiteSearch";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.search.title };
}

/**
 * Site search. The page is static like the others: everything searchable is gathered here (cached for
 * 5 minutes) and the browser filters it as the visitor types.
 */
export default async function SearchPage({ params }: PageProps<"/[lang]/search">) {
  const { lang, dict } = await resolveLang(params);
  const href = (path: string) => `/${lang}${path}`;
  const [news, { upcoming, past }, staff, clubs, programs, albums] = await Promise.all([
    getNews(),
    getEvents(),
    getStaff(),
    getClubs(),
    getPrograms(),
    getAlbums(),
  ]);
  const d = dict.navDesc;
  const pages: [string, string, string][] = [
    ["/about", dict.nav.about, d.about],
    ["/admissions", dict.nav.admissions, d.admissions],
    ["/timetable", dict.nav.timetable, dict.timetable.intro],
    ["/schedule", dict.nav.schedule, d.schedule],
    ["/staff", dict.nav.staff, dict.staff.intro],
    ["/news", dict.nav.news, dict.news.intro],
    ["/events", dict.nav.events, dict.events.intro],
    ["/programs", dict.nav.programs, d.programs],
    ["/clubs", dict.nav.clubs, d.clubs],
    ["/gallery", dict.gallery.title, d.gallery],
    ["/faq", dict.nav.faq, d.faq],
    ["/contact", dict.nav.contact, d.contact],
    ["/admissions/apply", dict.apply.title, dict.apply.lead],
  ];

  const items: SearchItem[] = [
    ...pages.map(([path, title, text]) => ({ type: "page" as const, title, text, href: href(path) })),
    ...news.map((n) => ({
      type: "news" as const,
      title: localized(n, "title", lang),
      text: localized(n, "body", lang).slice(0, 4000),
      meta: n.published_at ? formatDate(n.published_at, lang) : undefined,
      href: href(`/news/${n.slug}`),
    })),
    ...[...upcoming, ...past].map((e) => ({
      type: "event" as const,
      title: localized(e, "title", lang),
      text: [localized(e, "description", lang), e.location].filter(Boolean).join(" · "),
      meta: formatDate(e.starts_at, lang),
      href: href("/events"),
    })),
    ...staff.map((s) => ({
      type: "staff" as const,
      title: s.full_name,
      text: [positionLabel(s, lang), localized(s, "subject", lang)].filter(Boolean).join(" · "),
      href: href(`/staff/${s.id}`),
    })),
    ...clubs.map((c) => ({
      type: "club" as const,
      title: localized(c, "name", lang),
      text: [localized(c, "description", lang), c.staff?.full_name ?? c.leader].filter(Boolean).join(" · "),
      href: href(`/clubs/${c.id}`),
    })),
    ...programs.map((p) => ({
      type: "program" as const,
      title: localized(p, "name", lang),
      text: [localized(p, "summary", lang), localized(p, "description", lang)].filter(Boolean).join(" "),
      href: href(`/programs/${p.slug}`),
    })),
    ...dict.faq.items.map((f) => ({ type: "faq" as const, title: f.q, text: f.a, href: href("/faq") })),
    ...albums.map((a) => ({
      type: "album" as const,
      title: localized(a, "title", lang),
      text: localized(a, "description", lang),
      meta: a.event_date ? formatDate(a.event_date, lang) : undefined,
      href: href(`/gallery/${a.id}`),
    })),
  ];

  return (
    <>
      <PageHeader crumbs={[{ href: href(""), label: dict.nav.home }]} kicker={dict.search.kicker} title={dict.search.title} intro={dict.search.intro} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* The query comes from the address (?q=), which only the browser knows on a static page. */}
        <Suspense>
          <SiteSearch items={items} lang={lang} t={dict.search} />
        </Suspense>
      </div>
    </>
  );
}
