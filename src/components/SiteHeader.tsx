import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { currentSchoolYear, school, telHref } from "@/lib/school";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import SiteNav, { type NavEntry, type NavItem } from "./SiteNav";

/**
 * Edges of the header rows (owner's requests): the logo sits 40px from the left edge from xl
 * screens, and the menu and buttons go out to a wide 100rem column on the right. Percent padding
 * is of the full-width row.
 */
const edges = "pl-4 pr-4 xl:pl-10 xl:pr-[max(2rem,calc((100%_-_100rem)/2_+_2rem))]";

/** Top info bar (scrolls away) and the sticky navigation bar below it. */
export default function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const href = (path: string) => `/${lang}${path}`;
  const d = dict.navDesc;
  const entries: NavEntry[] = [
    { href: href(""), label: dict.nav.home },
    {
      key: "school",
      label: dict.nav.school,
      items: [
        { href: href("/about"), label: dict.nav.about, desc: d.about, icon: "info", color: "blue" },
        { href: href("/admissions"), label: dict.nav.admissions, desc: d.admissions, icon: "door", color: "green" },
        { href: href("/schedule"), label: dict.nav.schedule, desc: d.schedule, icon: "bell", color: "amber" },
        { href: href("/clubs"), label: dict.nav.clubs, desc: d.clubs, icon: "star", color: "coral" },
        { href: href("/faq"), label: dict.nav.faq, desc: d.faq, icon: "question", color: "blue" },
        { href: href("/contact"), label: dict.nav.contact, desc: d.contact, icon: "phone", color: "green" },
      ],
    },
    // Short label in the bar: the Russian "Расписание уроков" does not fit next to the buttons.
    { href: href("/timetable"), label: dict.nav.timetableShort },
    { href: href("/staff"), label: dict.nav.staff },
    { href: href("/news"), label: dict.nav.news },
    {
      key: "events",
      label: dict.nav.events,
      items: [
        { href: href("/events#upcoming"), label: dict.events.upcoming, desc: d.upcoming, icon: "calendar", color: "blue" },
        { href: href("/events#past"), label: dict.events.past, desc: d.past, icon: "history", color: "green" },
        { href: href("/programs"), label: dict.nav.programs, desc: d.programs, icon: "repeat", color: "coral" },
        { href: href("/gallery"), label: dict.nav.gallery, desc: d.gallery, icon: "photo", color: "amber" },
      ],
    },
  ];
  const emaktab: NavItem = { href: school.eMaktabUrl, label: "eMaktab", desc: d.emaktab, icon: "grade", color: "amber", external: true };
  const year = currentSchoolYear();

  return (
    <>
      <div className="hidden border-b border-white/[0.07] bg-navy text-[12.5px] text-[#aeb8d4] md:block">
        <div className={`flex items-center justify-between gap-4 py-2 ${edges}`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {school.address &&
              (school.mapUrl ? (
                <a href={school.mapUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  📍 {school.address[lang]}
                </a>
              ) : (
                <span>📍 {school.address[lang]}</span>
              ))}
            {school.phone && (
              <a href={telHref(school.phone)} className="transition-colors hover:text-white">
                ☎ {school.phone}
              </a>
            )}
            <span>{fill(dict.topbar.year, year)}</span>
          </div>
          <a
            href={school.eMaktabUrl}
            target="_blank"
            rel="noopener noreferrer"
            // From xl it sits in the navbar instead (owner's request).
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] py-1 pl-2.5 pr-3 text-[11.5px] font-semibold text-[#bee6dc] transition-colors hover:bg-white/15 hover:text-white xl:hidden"
          >
            <span className="size-1.5 rounded-full bg-[#3ecfb2]" />
            {dict.emaktab.short} ↗<span className="sr-only"> ({dict.emaktab.newTab})</span>
          </a>
        </div>
      </div>

      <header className="site-header sticky top-0 z-30 bg-navy text-white shadow-[0_1px_0_rgb(255_255_255/0.08)]">
        <div className={`flex h-16 items-center justify-between gap-3 lg:h-[74px] ${edges}`}>
          <Link href={href("")} className="group/logo flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
            <span className="relative grid size-10 place-items-center rounded-xl bg-white text-lg font-extrabold tracking-tight text-navy transition-transform duration-300 ease-(--ease-spring) after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:rounded after:bg-gold after:transition-[left,right] after:duration-300 group-hover/logo:-rotate-6 group-hover/logo:after:inset-x-2 lg:size-11">
              <span className="-translate-y-0.5">14</span>
            </span>
            <span className="leading-tight max-[374px]:hidden">
              <b className="block text-[15px] font-bold tracking-tight sm:text-base">{dict.site.name}</b>
              <small className="block text-[11px] font-semibold uppercase tracking-wider text-[#93a0c4] max-sm:hidden lg:hidden xl:block">
                {dict.site.tagline}
              </small>
            </span>
          </Link>

          <SiteNav home={href("")} entries={entries} labels={{ menu: dict.nav.menu, newTab: dict.emaktab.newTab, extra: emaktab }}>
            <a
              href={school.eMaktabUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={dict.emaktab.short}
              // Just the name here, so the Russian bar still fits at 1280px; the full label is the tooltip.
              className="press mr-3 hidden h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.07] pl-3 pr-3.5 text-[12.5px] font-semibold text-[#bee6dc] transition-colors hover:bg-white/15 hover:text-white xl:inline-flex"
            >
              <span className="size-1.5 rounded-full bg-[#3ecfb2]" />
              eMaktab ↗<span className="sr-only"> — {dict.emaktab.short} ({dict.emaktab.newTab})</span>
            </a>
            <ThemeToggle t={dict.theme} />
            <LanguageSwitcher current={lang} />
          </SiteNav>
        </div>
      </header>
    </>
  );
}
