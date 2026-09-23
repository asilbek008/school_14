"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  // Swap the first path segment (the locale) and keep the rest of the URL.
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav aria-label="Language" className="flex gap-1 text-sm">
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
          className={`rounded px-2 py-1 uppercase ${
            locale === current
              ? "bg-blue-700 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
