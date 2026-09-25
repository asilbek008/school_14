import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getAlbums, getClasses, getClubs, getNews, getPrograms, getSchoolYears, getStaff, getTests } from "@/lib/content";
import { siteUrl } from "@/lib/school";

export const revalidate = 3600;

const pages = ["", "/about", "/admissions", "/timetable", "/schedule", "/calendar", "/staff", "/news", "/events", "/programs", "/achievements", "/tests", "/tests/dtm", "/clubs", "/gallery", "/faq", "/documents", "/contact"];

/**
 * Every public page in the three languages, each naming its translations (hreflang), so search engines
 * list the site and send each visitor to their language.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, staff, clubs, programs, albums, classes, years, tests] = await Promise.all([
    getNews(),
    getStaff(),
    getClubs(),
    getPrograms(),
    getAlbums(),
    getClasses(),
    getSchoolYears(),
    getTests(),
  ]);
  const paths: { path: string; modified?: string | null; priority: number }[] = [
    ...pages.map((path) => ({ path, priority: path === "" ? 1 : 0.8 })),
    ...news.map((n) => ({ path: `/news/${n.slug}`, modified: n.published_at, priority: 0.6 })),
    ...staff.map((s) => ({ path: `/staff/${s.id}`, priority: 0.4 })),
    ...clubs.map((c) => ({ path: `/clubs/${c.id}`, priority: 0.5 })),
    ...programs.map((p) => ({ path: `/programs/${p.slug}`, priority: 0.6 })),
    ...albums.map((a) => ({ path: `/gallery/${a.id}`, modified: a.event_date, priority: 0.4 })),
    ...tests.map((t) => ({ path: `/tests/${t.id}`, priority: 0.5 })),
    ...classes.map((c) => ({ path: `/timetable/${c.id}`, priority: 0.5 })),
    ...years.map((y) => ({ path: `/year/${y.start_year}`, priority: 0.3 })),
  ];
  return paths.flatMap(({ path, modified, priority }) =>
    locales.map((lang) => ({
      url: `${siteUrl}/${lang}${path}`,
      lastModified: modified ? new Date(modified) : undefined,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])) },
    })),
  );
}
