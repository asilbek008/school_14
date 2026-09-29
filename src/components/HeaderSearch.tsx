"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/fill";
import { norm } from "@/lib/search-match";
import type { SearchItem, SearchType } from "./SiteSearch";

export type HeaderSearchLabels = {
  label: string;
  placeholder: string;
  hint: string;
  noResults: string;
  all: string;
  types: Record<SearchType, string>;
};

const SHOWN = 8;

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

/**
 * Search from the bar on every page, answered in place.
 *
 * The list of everything searchable is fetched once from /api/search/<lang>, the first time the box
 * is opened, and the filtering then happens here -- so a page that is never searched pays nothing,
 * and once the list is in hand every keystroke is instant with no round trip. Choosing a result goes
 * straight to that page; the full search page is still one link away for a long list of hits.
 */
export default function HeaderSearch({ lang, t, className = "" }: { lang: Locale; t: HeaderSearchLabels; className?: string }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [active, setActive] = useState(0);

  // Fetched on first open and kept for the rest of the visit. The ref, rather than a `loading` state,
  // is what stops a second request: it is set before the fetch without asking for a render.
  const asked = useRef(false);
  useEffect(() => {
    if (!open || asked.current) return;
    asked.current = true;
    fetch(`/api/search/${lang}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SearchItem[]) => setItems(data))
      .catch(() => setItems([]));
  }, [open, lang]);

  // The menu has a search row of its own; it asks for this panel rather than carrying a second one.
  useEffect(() => {
    const ask = () => setOpen(true);
    window.addEventListener("site-search:open", ask);
    return () => window.removeEventListener("site-search:open", ask);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    // The page behind the panel holds still while it is open.
    const html = document.documentElement;
    const had = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      html.style.overflow = had;
    };
  }, [open]);

  const index = useMemo(() => (items ?? []).map((item) => ({ item, title: norm(item.title), body: norm(`${item.text} ${item.meta ?? ""}`) })), [items]);

  const words = norm(query).trim().split(/\s+/).filter(Boolean);
  const ready = norm(query).trim().length >= 2;
  const results = useMemo(() => {
    if (!ready) return [];
    return index
      .filter(({ title, body }) => words.every((w) => title.includes(w) || body.includes(w)))
      .map(({ item, title }) => ({ item, score: words.filter((w) => title.includes(w)).length + (title.startsWith(words[0]) ? 1 : 0) }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
    // `words` is derived from `query`, so the query is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, query, ready]);

  const shown = results.slice(0, SHOWN);

  function choose(href: string) {
    setOpen(false);
    setQuery("");
    if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
    else router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!shown.length) return;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % shown.length : (i - 1 + shown.length) % shown.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active].href);
      else if (ready) choose(`/${lang}/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={t.label}
        title={t.label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`press grid size-9 shrink-0 place-items-center rounded-xl text-[#c2cbe4] transition-colors hover:bg-white/10 hover:text-white sm:size-10 ${className}`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 top-16 z-40 animate-fade-in bg-navy/40 [animation-duration:0.2s] lg:top-[68px]">
          <div ref={panel} className="menu-card surface mx-auto mt-2 max-h-[min(80dvh,34rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-paper p-2 text-slate-900 shadow-[0_8px_16px_-8px_rgb(19_26_46/0.2),0_32px_64px_-24px_rgb(19_26_46/0.45)]">
            <div className="space-y-2">
              <div className="relative">
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={input}
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-brand"
                />
              </div>

              {!ready && <p className="px-2 pb-1 text-[12.5px] text-slate-500">{t.hint}</p>}

              {ready && items === null && <p className="px-2 pb-1 text-[12.5px] text-slate-500">…</p>}

              {ready && items !== null && !shown.length && <p className="px-2 pb-1 text-[12.5px] text-slate-500">{fill(t.noResults, { q: query })}</p>}

              {shown.map((item, i) => (
                <button
                  key={`${item.href}-${i}`}
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(item.href)}
                  className={`press block w-full rounded-xl px-2.5 py-2 text-left transition-colors ${i === active ? "bg-white" : "hover:bg-white"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColors[item.type]}`}>{t.types[item.type]}</span>
                    <b className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{item.title}</b>
                  </span>
                  {item.text && <span className="mt-0.5 block truncate text-[12px] text-slate-500">{item.text}</span>}
                </button>
              ))}

              {results.length > SHOWN && (
                <Link
                  href={`/${lang}/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                  className="press block rounded-xl bg-white px-2.5 py-2 text-center text-[12.5px] font-bold text-brand transition-colors hover:bg-brand-soft"
                >
                  {t.all} ({results.length})
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
