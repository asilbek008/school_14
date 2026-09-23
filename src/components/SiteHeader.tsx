import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = ["news", "events", "about", "staff", "admissions", "contact"] as const;

export default function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = navItems.map((item) => ({ href: `/${lang}/${item}`, label: dict.nav[item] }));

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center gap-2 text-lg font-bold text-blue-800">
          <span className="grid size-9 place-items-center rounded-full bg-blue-700 text-sm text-white">14</span>
          {dict.site.name}
        </Link>

        <nav className="hidden gap-5 text-sm font-medium text-slate-700 lg:flex">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-blue-700">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher current={lang} />
          {/* Mobile menu: native <details> so it works without client JS. */}
          <details className="group relative lg:hidden">
            <summary
              aria-label={dict.nav.menu}
              className="grid size-9 cursor-pointer list-none place-items-center rounded border border-slate-300 text-slate-700 [&::-webkit-details-marker]:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
                <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
              </svg>
            </summary>
            <nav className="absolute right-0 mt-2 flex w-56 flex-col rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
              {links.map(({ href, label }) => (
                <Link key={href} href={href} className="px-4 py-2 text-slate-700 hover:bg-slate-50">
                  {label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
