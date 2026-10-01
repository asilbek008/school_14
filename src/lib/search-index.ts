import "server-only";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { getAlbums, getClubs, getEvents, getNews, getPrograms, getStaff, getTests, getTextbooks, localized } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { positionLabel } from "@/lib/positions";
import { school } from "@/lib/school";
import type { SearchItem } from "@/components/SiteSearch";

/**
 * Everything the site can be searched through, in one list.
 *
 * Two readers: the search page, which wants the whole article body so a word deep in a story is
 * still found, and the header search, which is fetched over the network and only needs enough text
 * to show a line under each hit. `brief` is that second shape -- the same items with the long text
 * cut down, which keeps the download small enough to fetch the moment someone opens the box.
 */
export async function buildSearchIndex(lang: Locale, dict: Dictionary, { brief = false } = {}): Promise<SearchItem[]> {
  const href = (path: string) => `/${lang}${path}`;
  const cut = (text: string) => (brief ? text.slice(0, 180) : text.slice(0, 4000));

  const [news, { upcoming, past }, staff, clubs, programs, albums, tests, books] = await Promise.all([
    getNews(),
    getEvents(),
    getStaff(),
    getClubs(),
    getPrograms(),
    getAlbums(),
    getTests(),
    getTextbooks(),
  ]);

  const d = dict.navDesc;
  const pages: [string, string, string][] = [
    ["/about", dict.nav.about, d.about],
    ["/admissions", dict.nav.admissions, d.admissions],
    ["/timetable", dict.nav.timetable, dict.timetable.intro],
    ["/schedule", dict.nav.schedule, d.schedule],
    ["/calendar", dict.calendar.title, d.calendar],
    ["/staff", dict.nav.staff, dict.staff.intro],
    ["/news", dict.nav.news, dict.news.intro],
    ["/events", dict.nav.events, dict.events.intro],
    ["/programs", dict.nav.programs, d.programs],
    ["/achievements", dict.achievements.title, d.achievements],
    ["/tests", dict.tests.title, dict.tests.intro],
    ["/tests/dtm", dict.tests.dtm.title, dict.tests.dtm.intro],
    ["/tests/practice", dict.tests.practice.title, dict.tests.practice.intro],
    ["/tests/path", dict.tests.path.card, dict.tests.path.intro],
    ["/library", dict.library.title, dict.library.intro],
    ["/alumni", dict.alumni.title, dict.alumni.intro],
    ["/clubs", dict.nav.clubs, d.clubs],
    ["/gallery", dict.gallery.title, d.gallery],
    ["/faq", dict.nav.faq, d.faq],
    ["/surveys", dict.surveys.title, dict.surveys.intro],
    ["/openness", dict.openness.title, dict.openness.intro],
    ["/cabinet", dict.cabinet.title, dict.cabinet.intro],
    ...(school.showDocuments ? [["/documents", dict.documents.title, dict.documents.intro] as [string, string, string]] : []),
    ["/contact", dict.nav.contact, d.contact],
    ["/admissions/apply", dict.apply.title, dict.apply.lead],
    ["/privacy", dict.privacy.title, dict.privacy.lead],
  ];

  return [
    ...pages.map(([path, title, text]) => ({ type: "page" as const, title, text, href: href(path) })),
    ...news.map((n) => ({
      type: "news" as const,
      title: localized(n, "title", lang),
      text: cut(localized(n, "body", lang)),
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
      text: cut([localized(p, "summary", lang), localized(p, "description", lang)].join(" ")),
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
    ...tests.map((x) => ({
      type: "page" as const,
      title: localized(x, "title", lang),
      text: [dict.tests.subjects[x.subject as keyof typeof dict.tests.subjects], localized(x, "description", lang)].filter(Boolean).join(" · "),
      href: href(`/tests/${x.id}`),
    })),
    ...books.map((b) => ({
      type: "page" as const,
      title: localized(b, "title", lang),
      text: [b.subjects && localized(b.subjects, "name", lang), b.grade && fill(dict.library.grade, { n: b.grade }), b.author].filter(Boolean).join(" · "),
      href: b.kind === "file" ? href(`/library/${b.id}`) : (b.url ?? href("/library")),
    })),
  ];
}
