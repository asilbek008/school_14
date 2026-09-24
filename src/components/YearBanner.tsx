"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { setSiteYear, siteYearSnapshot, subscribeSiteYear } from "@/lib/site-year";

type Labels = { banner: string; bannerHint: string; back: string; page: string };

/**
 * Under the header while a past school year is picked: says so, links to the year's page and back to the
 * current year, and hides the other years' items (and the all-years totals) on news, events and gallery (their lists are marked
 * `year-scope`, the items carry `data-year`), so the cached pages stay the same for everyone.
 */
export default function YearBanner({ lang, current, t }: { lang: string; current: number; t: Labels }) {
  const year = Number(useSyncExternalStore(subscribeSiteYear, siteYearSnapshot, () => ""));
  if (!year || year === current) return null;
  const label = `${year}–${year + 1}`;
  return (
    <div className="border-b border-gold/40 bg-gold-soft text-sm text-slate-800">
      <style>{`.year-scope [data-year]:not([data-year="${year}"]),.year-scope [data-cat="__all"],.year-scope .year-hide{display:none!important}`}</style>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5">
        <span>
          📅 <b>{t.banner.replace("{y}", label)}</b> <span className="text-slate-600">— {t.bannerHint}</span>
        </span>
        <span className="flex gap-4 font-bold">
          <Link href={`/${lang}/year/${year}`} className="text-gold-deep link-grow">
            {t.page} →
          </Link>
          <button type="button" onClick={() => setSiteYear(null)} className="text-brand link-grow">
            {t.back}
          </button>
        </span>
      </div>
    </div>
  );
}
