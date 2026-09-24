"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  // Swap the first path segment (the locale) and keep the rest of the URL.
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav aria-label="Language" className="flex gap-0.5 rounded-full bg-white/10 p-1 text-[11px] font-semibold sm:gap-1 sm:text-xs">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest ? `/${rest}` : ""}`}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          title={localeNames[locale]}
          onClick={() => {
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`rounded-full px-2 py-1 uppercase sm:px-2.5 transition-colors duration-200 ${
            locale === current ? "bg-white text-navy" : "text-slate-300 hover:text-white"
          }`}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
