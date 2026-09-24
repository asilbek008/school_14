"use client";

import { useState } from "react";

/**
 * Filter chips (and an optional search box) for a server-rendered list. Items stay server-rendered
 * (and cacheable); the controls only inject CSS rules hiding children whose data-cat doesn't match
 * the chosen chip, or whose data-q (lower-case title) doesn't contain the search text.
 */
export default function CategoryFilter({
  allLabel,
  searchLabel,
  options,
  children,
}: {
  allLabel: string;
  /** Shows a search box (placeholder text) that filters items by their data-q. */
  searchLabel?: string;
  options: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Quotes and backslashes would break out of the CSS string.
  const q = query.trim().toLowerCase().replace(/["\\\n]/g, "");
  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-bold transition ${
      selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="category-filter">
      {active && <style>{`.category-filter [data-cat]:not([data-cat="${active}"]){display:none}`}</style>}
      {q && <style>{`.category-filter [data-q]:not([data-q*="${q}" i]){display:none}`}</style>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        {searchLabel && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand sm:w-72"
          />
        )}
      </div>
      {children}
    </div>
  );
}
