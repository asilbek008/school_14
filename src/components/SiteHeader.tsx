import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";

const schoolItems = ["about", "staff", "schedule", "faq"] as const;
const afterItems = ["admissions", "contact"] as const;

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="size-4 transition group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const href = (item: string) => `/${lang}/${item}`;
  const pill = "rounded-full px-3.5 py-2 text-slate-300 hover:bg-white/10 hover:text-white";
  const allItems = ["news", "events", ...schoolItems, ...afterItems] as const;

  return (
    <header className="sticky top-0 z-30 bg-navy text-white shadow-[0_1px_0_rgb(255_255_255/0.08)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-white font-extrabold text-navy after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded after:bg-gold">
            14
          </span>
          <span className="leading-tight">
            <b className="block text-[15px]">{dict.site.name}</b>
            <small className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {dict.site.tagline}
            </small>
          </span>
        </Link>

        <nav className="hidden items-center text-sm font-semibold lg:flex">
          <Link href={href("news")} className={pill}>{dict.nav.news}</Link>
          <Link href={href("events")} className={pill}>{dict.nav.events}</Link>
          {/* Desktop dropdown: opens on hover, and on keyboard focus (:focus-visible, so a mouse click on a link doesn't leave it stuck open). */}
          <div className="group relative">
            <button type="button" aria-haspopup="true" className={`${pill} flex items-center gap-1`}>
              {dict.nav.school} <Chevron />
            </button>
            <div className="invisible absolute left-1/2 top-full w-64 -translate-x-1/2 pt-3 opacity-0 transition group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
                {schoolItems.map((item) => (
                  <Link key={item} href={href(item)} className="block rounded-xl px-3 py-2.5 hover:bg-paper">
                    {dict.nav[item]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {afterItems.map((item) => (
            <Link key={item} href={href(item)} className={pill}>{dict.nav[item]}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher current={lang} />
          {/* Mobile menu: native <details> so it works without client JS. */}
          <details className="group relative lg:hidden">
            <summary
              aria-label={dict.nav.menu}
              className="grid size-10 cursor-pointer list-none place-items-center rounded-xl hover:bg-white/10 [&::-webkit-details-marker]:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
                <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
              </svg>
            </summary>
            <nav className="absolute right-0 mt-2 flex w-64 flex-col rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
              {allItems.map((item) => (
                <Link key={item} href={href(item)} className="rounded-xl px-3 py-2.5 font-medium hover:bg-paper">
                  {dict.nav[item]}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
