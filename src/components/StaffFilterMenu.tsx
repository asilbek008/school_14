"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { positionKey, type StaffGroup } from "@/lib/positions";
import type { StaffFilters, StaffRow } from "./StaffDirectory";

export const groupDot: Record<StaffGroup, string> = { leaders: "bg-brand", teachers: "bg-teal", others: "bg-gold" };

/** Does a person pass the filter? "" everyone, "g:" a group, "p:" a position, "s:" a subject. */
export function matches(r: StaffRow, value: string) {
  if (!value) return true;
  const rest = value.slice(2);
  if (value.startsWith("g:")) return r.group === rest;
  if (value.startsWith("p:")) return r.positionKey === rest;
  return r.subjectKey.includes(positionKey(rest));
}

type Labels = { allPositions: string; filterLabel: string; groups: Record<StaffGroup, string>; wholeGroup: string };

/** Position / subject picker: a listbox grouped as leadership, teachers and other staff, with counts. */
export default function FilterMenu({
  value,
  onChange,
  filters,
  count,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  filters: StaffFilters;
  count: (value: string) => number;
  t: Labels;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const current =
    filters.flatMap((g) => g.items).find((i) => i.value === value)?.label ??
    (value.startsWith("g:") ? t.groups[value.slice(2) as StaffGroup] : t.allPositions);

  // Close on a click outside; on opening, focus the chosen option.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  };

  const keys = (e: KeyboardEvent) => {
    const options = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const i = options.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      options[(n + options.length) % options.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(options.length - 1);
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
    }
  };

  const option = (v: string, label: string, opts: { head?: StaffGroup; indent?: boolean } = {}) => {
    const n = count(v);
    const selected = value === v;
    return (
      <li key={v || "all"} role="none">
        <button
          type="button"
          role="option"
          aria-selected={selected}
          tabIndex={-1}
          onClick={() => choose(v)}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:bg-slate-100 hover:bg-slate-100 ${
            opts.indent ? "pl-8" : ""
          } ${selected ? "bg-brand-soft text-brand-deep hover:bg-brand-soft" : n ? "text-slate-800" : "text-slate-400"} ${opts.head || !opts.indent ? "font-bold" : "font-medium"}`}
        >
          {opts.head && <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${groupDot[opts.head]}`} />}
          <span className="min-w-0 flex-1">
            {label}
            {opts.head && <span className="font-medium text-slate-400"> — {t.wholeGroup}</span>}
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${selected ? "bg-brand/15" : "bg-slate-100 text-slate-500"}`}>{n}</span>
          <svg viewBox="0 0 24 24" className={`size-4 shrink-0 ${selected ? "" : "invisible"}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5L19 7" />
          </svg>
        </button>
      </li>
    );
  };

  return (
    <div ref={root} className="relative sm:w-80">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.filterLabel}: ${current}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`flex w-full items-center gap-2 rounded-full border bg-white py-3 pl-4 pr-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft ${
          open || value ? "border-brand" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {value.startsWith("g:") && <span aria-hidden className={`size-2 shrink-0 rounded-full ${groupDot[value.slice(2) as StaffGroup]}`} />}
        <span className={`min-w-0 flex-1 truncate ${value ? "font-semibold text-slate-900" : "text-slate-600"}`}>{current}</span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{count(value)}</span>
        <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-slate-400 transition-transform duration-300 ease-(--ease-spring) ${open ? "rotate-180 text-brand" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label={t.filterLabel}
          onKeyDown={keys}
          className="absolute right-0 top-full z-20 mt-2 max-h-[min(70vh,34rem)] w-full animate-fade-in overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_26px_50px_-20px_rgb(22_27_51/0.45)] [animation-duration:.2s] sm:w-96"
        >
          {option("", t.allPositions)}
          {filters.map((g) => (
            <li key={g.group} role="none" className="mt-1 border-t border-slate-100 pt-1">
              <ul role="group" aria-label={t.groups[g.group]}>
                {option(`g:${g.group}`, t.groups[g.group], { head: g.group })}
                {g.items.map((i) => option(i.value, i.label, { indent: true }))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
