"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { localeNames, locales, type Locale } from "@/i18n/config";

/**
 * One button showing the language in use; the other two are a tap away (owner's request). Three
 * chips side by side ate the room a phone needs for the search and the menu button.
 *
 * Built on <details>, like the rest of the site's menus, so it opens before any JavaScript arrives
 * and every language stays a plain link a crawler can follow.
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  // Swap the first path segment (the locale) and keep the rest of the URL.
  const rest = pathname.split("/").slice(2).join("/");

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="group/lang relative">
      <summary
        aria-label={localeNames[current]}
        title={localeNames[current]}
        className="press flex h-9 cursor-pointer list-none items-center gap-1 rounded-full bg-[var(--hdr-hover)] pl-2.5 pr-2 text-xs font-semibold uppercase text-[var(--hdr-fg)] transition-colors hover:bg-[var(--hdr-line)] [&::-webkit-details-marker]:hidden sm:h-10 sm:pl-3"
      >
        {current}
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 transition-transform duration-200 group-open/lang:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <nav
        aria-label="Language"
        className="surface absolute right-0 top-full z-50 mt-2 w-36 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg [animation-duration:0.18s]"
      >
        {locales.map((locale) => (
          <Link
            key={locale}
            href={`/${locale}${rest ? `/${rest}` : ""}`}
            hrefLang={locale}
            lang={locale}
            aria-current={locale === current ? "true" : undefined}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
              if (ref.current) ref.current.open = false;
            }}
            className={`press flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors ${
              locale === current ? "bg-paper text-brand" : "hover:bg-paper"
            }`}
          >
            {localeNames[locale]}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{locale}</span>
          </Link>
        ))}
      </nav>
    </details>
  );
}
