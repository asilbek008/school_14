"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/fill";

const DAY = 86_400_000;
const TASHKENT = 5 * 3_600_000;
/** Days since the epoch on the Tashkent calendar. */
const tashkentDay = (ms: number) => Math.floor((ms + TASHKENT) / DAY);
const noop = () => () => {};

/**
 * "Today" / "Tomorrow" / "in 5 days" until an event. Worked out in the browser (the page is cached,
 * so a server-rendered count would go stale at midnight); renders nothing on the server.
 */
export default function DaysLeft({
  startsAt,
  lang,
  t,
}: {
  startsAt: string;
  lang: Locale;
  t: { today: string; tomorrow: string; inDays: Record<string, string> };
}) {
  const today = useSyncExternalStore(noop, () => tashkentDay(Date.now()), () => null);
  if (today === null) return null;
  const days = tashkentDay(Date.parse(startsAt)) - today;
  const text = days <= 0 ? t.today : days === 1 ? t.tomorrow : plural(t.inDays, days, lang);
  const soon = days <= 1;
  return (
    <span
      className={`shrink-0 animate-fade-in whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
        soon ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"
      }`}
    >
      {text}
    </span>
  );
}
