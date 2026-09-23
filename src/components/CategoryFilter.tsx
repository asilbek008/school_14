"use client";

import { useState } from "react";

/**
 * Filter chips for a server-rendered list. Items stay server-rendered (and cacheable); the
 * chips only inject a CSS rule hiding children whose data-cat doesn't match the selection.
 */
export default function CategoryFilter({
  allLabel,
  options,
  children,
}: {
  allLabel: string;
  options: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-bold transition ${
      selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
    }`;

  return (
    <div className="category-filter">
      {active && <style>{`.category-filter [data-cat]:not([data-cat="${active}"]){display:none}`}</style>}
      <div className="mb-6 flex flex-wrap gap-2" role="group">
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
      {children}
    </div>
  );
}
