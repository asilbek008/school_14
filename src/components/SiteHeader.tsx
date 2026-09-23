import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = ["news", "events", "about", "staff", "admissions", "contact"] as const;

export default function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="text-lg font-bold text-blue-800">
          {dict.site.name}
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
          {navItems.map((item) => (
            <Link key={item} href={`/${lang}/${item}`} className="hover:text-blue-700">
              {dict.nav[item]}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher current={lang} />
      </div>
    </header>
  );
}
