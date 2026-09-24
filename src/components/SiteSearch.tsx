"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { fill, plural } from "@/i18n/fill";

export const searchTypes = ["page", "news", "event", "staff", "club", "program", "faq", "album"] as const;
export type SearchType = (typeof searchTypes)[number];
export type SearchItem = { type: SearchType; title: string; text: string; meta?: string; href: string };

export type SearchLabels = {
  placeholder: string;
  hint: string;
  noResults: string;
  found: Record<string, string>;
  more: string;
  all: string;
  types: Record<SearchType, string>;
};

const PER_GROUP = 5;

/** Lower case, one apostrophe for o‘/o'/oʻ, ё as е — so "o'qituvchi" finds "O‘qituvchi". */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/ё/g, "е");

/** A piece of the text around the first word found, for the result line. */
function snippet(text: string, words: string[]) {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = norm(flat);
  const at = words.map((w) => lower.indexOf(w)).find((i) => i >= 0) ?? 0;
  const start = Math.max(0, at - 60);
  return (start > 0 ? "…" : "") + flat.slice(start, start + 170) + (start + 170 < flat.length ? "…" : "");
}

const typeColors: Record<SearchType, string> = {
  page: "bg-slate-100 text-slate-700",
  news: "bg-brand-soft text-brand-deep",
  event: "bg-gold-soft text-gold-deep",
  staff: "bg-teal-soft text-[#0c6d62]",
  club: "bg-[#fae7e2] text-[#c9553f]",
  program: "bg-[#fae7e2] text-[#c9553f]",
  faq: "bg-brand-soft text-brand-deep",
  album: "bg-gold-soft text-gold-deep",
};

/** Search box and results grouped by kind; the query is kept in the address (?q=) so it can be shared. */
export default function SiteSearch({ items, lang, t }: { items: SearchItem[]; lang: Locale; t: SearchLabels }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [type, setType] = useState<SearchType | null>(null);
  const [open, setOpen] = useState<Set<SearchType>>(new Set());

  const index = useMemo(() => items.map((item) => ({ item, title: norm(item.title), body: norm(`${item.text} ${item.meta ?? ""}`) })), [items]);
  const words = norm(query).split(/\s+/).filter(Boolean);
  const ready = norm(query).trim().length >= 2;
  const results = ready
    ? index
        .filter(({ title, body }) => words.every((w) => title.includes(w) || body.includes(w)))
        .map(({ item, title }) => ({ item, score: words.filter((w) => title.includes(w)).length + (title.startsWith(words[0]) ? 1 : 0) }))
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item)
    : [];
  const counts = searchTypes.map((k) => [k, results.filter((r) => r.type === k).length] as const).filter(([, n]) => n > 0);
  const shownTypes = type && counts.some(([k]) => k === type) ? [type] : counts.map(([k]) => k);

  const change = (value: string) => {
    setQuery(value);
    setOpen(new Set());
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };
  const chip = (selected: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
      selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
    }`;

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{t.placeholder}</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => change(e.target.value)}
          placeholder={t.placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-5 text-base shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft"
        />
      </label>

      {!ready ? (
        <p className="mt-4 text-sm text-slate-500">{t.hint}</p>
      ) : results.length === 0 ? (
        <p className="mt-6 rounded-[14px] border-[1.5px] border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {fill(t.noResults, { q: query.trim() })}
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2" role="group">
            <button type="button" aria-pressed={!type} className={chip(!type)} onClick={() => setType(null)}>
              {t.all} · {results.length}
            </button>
            {counts.map(([k, n]) => (
              <button key={k} type="button" aria-pressed={type === k} className={chip(type === k)} onClick={() => setType(k)}>
                {t.types[k]} · {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500" aria-live="polite">
            {plural(t.found, results.length, lang)}
          </p>

          <div className="mt-3 space-y-8">
            {shownTypes.map((k) => {
              const group = results.filter((r) => r.type === k);
              const limit = type || open.has(k) ? group.length : PER_GROUP;
              return (
                <section key={k}>
                  <h2 className="font-display mb-3 text-lg font-bold text-slate-900">{t.types[k]}</h2>
                  <ul className="space-y-2.5">
                    {group.slice(0, limit).map((r) => (
                      <li key={`${r.type}-${r.href}-${r.title}`}>
                        <Link
                          href={r.href}
                          className="lift group block rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-brand"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${typeColors[r.type]}`}>{t.types[r.type]}</span>
                            {r.meta && <span className="text-xs text-slate-500">{r.meta}</span>}
                          </span>
                          <b className="mt-1.5 block font-bold leading-snug text-slate-900 group-hover:text-brand">{r.title}</b>
                          {r.text && <span className="mt-1 block text-sm leading-relaxed text-slate-600">{snippet(r.text, words)}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {group.length > limit && (
                    <button
                      type="button"
                      onClick={() => setOpen(new Set(open).add(k))}
                      className="press mt-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand hover:border-brand"
                    >
                      {fill(t.more, { n: group.length - limit })}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
