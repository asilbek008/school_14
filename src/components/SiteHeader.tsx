import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { currentSchoolYear, school } from "@/lib/school";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import SiteNav, { type NavEntry, type NavItem } from "./SiteNav";
import YearSwitcher from "./YearSwitcher";
import { getSchoolYears } from "@/lib/content";

/**
 * Edges of the header rows (owner's requests): the logo sits 40px from the left edge from xl
 * screens, and the menu and buttons go out to a wide 100rem column on the right. Percent padding
 * is of the full-width row.
 */
const edges = "pl-4 pr-4 xl:pl-10 xl:pr-[max(2rem,calc((100%_-_100rem)/2_+_2rem))]";

/**
 * The sticky navigation bar. The old top info bar (address, phone, school year) is gone (owner's request): the
 * address and phone live in the footer and on the contact page, the year switcher above the home page title.
 */
export default async function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const href = (path: string) => `/${lang}${path}`;
  const d = dict.navDesc;
  const entries: NavEntry[] = [
    { href: href(""), label: dict.nav.home },
    // Alumni left the "School" menu (owner's request; the page stays, linked from the footer); documents are hidden
    // for now (`school.showDocuments`).
    {
      key: "school",
      label: dict.nav.school,
      items: [
        { href: href("/about"), label: dict.nav.about, desc: d.about, icon: "info", color: "blue" },
        { href: href("/admissions"), label: dict.nav.admissions, desc: d.admissions, icon: "door", color: "green" },
        { href: href("/schedule"), label: dict.nav.schedule, desc: d.schedule, icon: "bell", color: "amber" },
        { href: href("/library"), label: dict.nav.library, desc: d.library, icon: "book", color: "coral" },
        { href: href("/clubs"), label: dict.nav.clubs, desc: d.clubs, icon: "star", color: "coral" },
        { href: href("/faq"), label: dict.nav.faq, desc: d.faq, icon: "question", color: "blue" },
        { href: href("/contact"), label: dict.nav.contact, desc: d.contact, icon: "phone", color: "green" },
      ],
    },
    // Short label in the bar: the Russian "Расписание уроков" does not fit next to the buttons. The school-year
    // calendar sits here, next to the lessons (owner's request).
    {
      key: "timetable",
      label: dict.nav.timetableShort,
      items: [
        { href: href("/timetable"), label: dict.nav.timetable, desc: d.timetable, icon: "grade", color: "blue" },
        { href: href("/calendar"), label: dict.nav.calendar, desc: d.calendar, icon: "calendar", color: "green" },
      ],
    },
    // Tests stand on their own in the bar (owner's request), not inside "School".
    { href: href("/tests"), label: dict.nav.tests },
    { href: href("/staff"), label: dict.nav.staff },
    { href: href("/news"), label: dict.nav.news },
    {
      key: "events",
      label: dict.nav.events,
      items: [
        { href: href("/events#upcoming"), label: dict.events.upcoming, desc: d.upcoming, icon: "calendar", color: "blue" },
        { href: href("/events#past"), label: dict.events.past, desc: d.past, icon: "history", color: "green" },
        { href: href("/programs"), label: dict.nav.programs, desc: d.programs, icon: "repeat", color: "coral" },
        { href: href("/achievements"), label: dict.nav.achievements, desc: d.achievements, icon: "trophy", color: "amber" },
        { href: href("/gallery"), label: dict.nav.gallery, desc: d.gallery, icon: "photo", color: "amber" },
      ],
    },
  ];
  const emaktab: NavItem = { href: school.eMaktabUrl, label: "eMaktab", desc: d.emaktab, icon: "grade", color: "amber", external: true };
  const year = currentSchoolYear();
  // The year switcher: the current school year and every published past one, newest first.
  const years = [...new Set([year.from, ...(await getSchoolYears()).map((y) => y.start_year)])].sort((a, b) => b - a);
  const yearProps = { lang, years, current: year.from, format: dict.topbar.year, label: dict.year.choose, currentLabel: dict.year.current };

  return (
    <header className="site-header sticky top-0 z-30 bg-navy text-white shadow-[0_1px_0_rgb(255_255_255/0.08)]">
      <div className={`flex h-16 items-center justify-between gap-3 lg:h-[68px] ${edges}`}>
        <Link href={href("")} className="group/logo flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-white text-lg font-extrabold tracking-tight text-navy transition-transform duration-300 ease-(--ease-spring) after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:rounded after:bg-gold after:transition-[left,right] after:duration-300 group-hover/logo:-rotate-6 group-hover/logo:after:inset-x-2 lg:size-11">
            <span className="-translate-y-0.5">14</span>
          </span>
          <span className="leading-tight max-[374px]:hidden">
            <b className="block text-[15px] font-bold tracking-tight">{dict.site.name}</b>
            <small className="block text-[11px] font-semibold uppercase tracking-wider text-[#93a0c4] max-sm:hidden lg:hidden xl:block">
              {dict.site.tagline}
            </small>
          </span>
        </Link>

        <SiteNav home={href("")} entries={entries} labels={{ menu: dict.nav.menu, newTab: dict.emaktab.newTab, extra: emaktab, search: { action: href("/search"), label: dict.search.placeholder } }}
          yearMenu={<YearSwitcher {...yearProps} variant="menu" />}>
          <a
            href={school.eMaktabUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={dict.emaktab.short}
            // Just the name here, so the Russian bar still fits at 1280px; the full label is the tooltip.
            className="press mr-4 hidden h-10 2xl:mr-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.07] pl-3 pr-3.5 text-[12.5px] font-semibold text-[#bee6dc] transition-colors hover:bg-white/15 hover:text-white xl:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-[#3ecfb2]" />
            eMaktab ↗<span className="sr-only"> — {dict.emaktab.short} ({dict.emaktab.newTab})</span>
          </a>
          {/* Phones get the search at the top of the menu panel instead; from 1024 to 1100px the Russian bar has no room
              for it (the search page is still in reach from the footer). */}
          <Link
            href={href("/search")}
            aria-label={dict.nav.search}
            title={dict.nav.search}
            className="hidden size-10 shrink-0 place-items-center rounded-xl text-[#c2cbe4] transition-colors hover:bg-white/10 hover:text-white sm:max-lg:grid min-[1100px]:grid"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <ThemeToggle t={dict.theme} />
          <LanguageSwitcher current={lang} />
        </SiteNav>
      </div>
  </header>
  );
}
