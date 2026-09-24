"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Filter chips (and an optional search box) for a server-rendered list. Items stay server-rendered
 * (and cacheable); the controls only inject CSS rules hiding children whose data-cat (a space-separated
 * list, for an item in several groups) doesn't contain the chosen chip, or whose data-q (lower-case
 * title) doesn't contain the search text. Elements marked data-cat-only (and `hidden`) appear only while their chip is chosen.
 */
export default function CategoryFilter({
  allLabel,
  searchLabel,
  emptyLabel,
  options,
  children,
}: {
  allLabel: string;
  /** Shows a search box (placeholder text) that filters items by their data-q. */
  searchLabel?: string;
  /** Shown when the chip and search leave nothing visible. */
  emptyLabel?: string;
  options: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Quotes and backslashes would break out of the CSS string.
  const q = query.trim().toLowerCase().replace(/["\\\n]/g, "");
  const listRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLParagraphElement>(null);

  // After the rules apply, show the "nothing found" note if no item is left visible.
  useEffect(() => {
    if (!emptyRef.current || !listRef.current) return;
    const items = [...listRef.current.querySelectorAll<HTMLElement>("[data-q], [data-cat]:not([data-cat='__all'])")];
    emptyRef.current.hidden = !(active || q) || items.some((el) => el.offsetParent !== null);
  }, [active, q]);
  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-bold transition ${
      selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
    }`;

  return (
    // data-filtered lets items restyle while filtering (e.g. the featured news card turns normal).
    <div className="category-filter group/filter" data-filtered={active || q ? "" : undefined}>
      {/* data-cat-only: hidden by default, shown only for its chip (per-category counts, "none of this type" notes). */}
      {active && (
        <style>{`.category-filter [data-cat]:not([data-cat~="${active}"]){display:none}.category-filter [data-cat-only="${active}"]{display:revert!important}`}</style>
      )}
      {q && <style>{`.category-filter [data-q]:not([data-q*="${q}" i]){display:none}`}</style>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Without options only the search box shows (e.g. the FAQ). */}
        {options.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group">
            <button type="button" aria-pressed={!active} className={chip(!active)} onClick={() => setActive(null)}>
              {allLabel}
            </button>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={active === o.value}
                className={chip(active === o.value)}
                onClick={() => setActive(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        {searchLabel && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className={`w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand ${options.length ? "sm:w-72" : ""}`}
          />
        )}
      </div>
      <div ref={listRef}>{children}</div>
      {emptyLabel && (
        <p ref={emptyRef} hidden className="rounded-[14px] border-[1.5px] border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
