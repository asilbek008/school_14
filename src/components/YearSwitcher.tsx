"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { siteYearSnapshot, subscribeSiteYear } from "@/lib/site-year";

type Props = { lang: string; years: number[]; current: number; format: string; label: string; currentLabel: string; variant?: "hero" | "menu" };

const name = (format: string, y: number) => format.replace("{from}", String(y)).replace("{to}", String(y + 1));

/**
 * "2026–2027 ▾" above the home page title (it used to sit in a top bar): lists the school years; each opens its year page, which also
 * makes news, events and gallery show that year for the rest of the visit. In the mobile menu (variant
 * "menu") the years are a row of chips.
 */
export default function YearSwitcher({ lang, years, current, format, label, currentLabel, variant = "hero" }: Props) {
  const picked = Number(useSyncExternalStore(subscribeSiteYear, siteYearSnapshot, () => "")) || current;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (variant === "menu") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2.5 text-sm font-bold text-slate-500">{label}</p>
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`/${lang}/year/${y}`}
              aria-current={y === picked ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${y === picked ? "bg-navy text-white" : "bg-paper text-slate-700"}`}
            >
              {y}–{y + 1}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        aria-label={`${label}: ${name(format, picked)}`}
        className={`font-display inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors xl:px-3.5 xl:text-sm ${
          picked !== current ? "border-gold/40 bg-gold/20 text-[#f4c779]" : "border-white/15 bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {picked}–{picked + 1}
        <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="surface absolute left-0 top-full z-50 mt-2 w-60 font-sans animate-fade-in rounded-2xl bg-white p-2 text-slate-900 shadow-xl [animation-duration:0.15s]">
          <p className="px-3 pb-1.5 pt-1 text-xs font-bold text-slate-500">{label}</p>
          {years.map((y) => (
            <Link
              key={y}
              href={`/${lang}/year/${y}`}
              onClick={() => setOpen(false)}
              aria-current={y === picked ? "true" : undefined}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-paper ${y === picked ? "text-brand" : ""}`}
            >
              {name(format, y)}
              {y === current && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-deep">{currentLabel}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
