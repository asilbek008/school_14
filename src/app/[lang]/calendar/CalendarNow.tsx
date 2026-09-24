"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/fill";

const DAY = 86_400_000;
const TASHKENT = 5 * 3_600_000;
const noop = () => () => {};
/** Day number of a plain date ("2026-09-02"). */
const dayOf = (iso: string) => Math.floor(Date.parse(iso) / DAY);

export type NowItem = { title: string; kind: string; kindLabel: string; from: string; to: string; range: string };

type Labels = {
  now: string;
  next: string;
  study: string;
  endsIn: Record<string, string>;
  endsToday: string;
  startsIn: Record<string, string>;
  startsTomorrow: string;
  yearDone: string;
};

const tint: Record<string, string> = {
  chorak: "bg-brand-soft text-brand-deep",
  tatil: "bg-teal-soft text-[#0c6d62]",
  imtihon: "bg-gold-soft text-gold-deep",
  bayram: "bg-[#fae7e2] text-[#c9553f]",
  boshqa: "bg-slate-100 text-slate-600",
};

/**
 * What is on today and what comes next. Worked out in the browser on the Tashkent calendar (the page is
 * cached, so a server-rendered "today" would go stale); renders nothing on the server.
 */
export default function CalendarNow({ items, lang, t }: { items: NowItem[]; lang: Locale; t: Labels }) {
  const today = useSyncExternalStore(noop, () => Math.floor((Date.now() + TASHKENT) / DAY), () => null);
  if (today === null) return null;

  // A holiday or exam week inside a quarter says more about today than the quarter does.
  const current = items
    .filter((i) => dayOf(i.from) <= today && today <= dayOf(i.to))
    .sort((a, b) => Number(a.kind === "chorak") - Number(b.kind === "chorak"))[0];
  const next = items.filter((i) => dayOf(i.from) > today).sort((a, b) => dayOf(a.from) - dayOf(b.from))[0];
  if (!current && !next) return <p className="reveal mb-8 rounded-[14px] border border-slate-200 bg-white p-5 text-slate-600">{t.yearDone}</p>;

  const left = current ? dayOf(current.to) - today : 0;
  const until = next ? dayOf(next.from) - today : 0;

  return (
    <div className="mb-8 grid animate-fade-in gap-3.5 md:grid-cols-2">
      <Card
        label={t.now}
        item={current}
        fallback={t.study}
        badge={current ? (left === 0 ? t.endsToday : plural(t.endsIn, left, lang)) : null}
        strong
      />
      {next && <Card label={t.next} item={next} badge={until === 1 ? t.startsTomorrow : plural(t.startsIn, until, lang)} />}
    </div>
  );
}

function Card({ label, item, fallback, badge, strong }: { label: string; item?: NowItem; fallback?: string; badge: string | null; strong?: boolean }) {
  return (
    <div className={`rounded-[14px] border p-5 ${strong ? "border-brand/40 bg-white shadow-[inset_4px_0_0_var(--color-brand)]" : "border-slate-200 bg-white"}`}>
      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {item ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${tint[item.kind] ?? tint.boshqa}`}>{item.kindLabel}</span>
            {badge && <span className="text-[13px] font-semibold text-slate-600">{badge}</span>}
          </div>
          <b className="font-display mt-2 block text-[18px] tracking-tight text-slate-900">{item.title}</b>
          <p className="mt-0.5 text-sm text-slate-600">{item.range}</p>
        </>
      ) : (
        <b className="font-display mt-2 block text-[18px] tracking-tight text-slate-900">{fallback}</b>
      )}
    </div>
  );
}
