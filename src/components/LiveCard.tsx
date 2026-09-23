"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { shifts, shiftStatus, tashkentNow, type ShiftStatus } from "@/lib/bells";

type Labels = Dictionary["live"];

function statusText(status: ShiftStatus, t: Labels) {
  switch (status.kind) {
    case "dayoff": return t.dayoff;
    case "before": return fill(t.before, { time: status.startsAt });
    case "lesson": return fill(t.lesson, { n: status.n, m: status.minutesLeft });
    case "break": return fill(t.break, { n: status.nextLesson, m: status.minutesLeft });
    case "after": return t.after;
  }
}

const progressOf = (s: ShiftStatus) =>
  s.kind === "lesson" || s.kind === "break" ? s.progress : s.kind === "after" ? 1 : 0;

export default function LiveCard({ t, scheduleHref }: { t: Labels; scheduleHref: string }) {
  // Computed only in the browser: the server-rendered HTML is cached, so "now" must be client-side.
  const [now, setNow] = useState<ReturnType<typeof tashkentNow> | null>(null);
  useEffect(() => {
    const tick = () => setNow(tashkentNow());
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);

  const statuses = now ? shifts.map((s) => shiftStatus(s, now.weekday, now.minutes)) : null;
  const active = statuses?.some((s) => s.kind === "lesson" || s.kind === "break");

  return (
    <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-xl">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${active ? "animate-pulse bg-teal" : "bg-slate-300"}`} />
        <b>{t.title}</b>
        <span className="ml-auto text-2xl font-extrabold tabular-nums tracking-tight">{now?.clock ?? "--:--"}</span>
      </div>
      <p className="mb-3 mt-1 text-xs text-slate-500">{t.tz}</p>
      {shifts.map((shift, i) => {
        const status = statuses?.[i];
        return (
          <div key={shift.id} className="border-t border-slate-100 py-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  shift.id === 1 ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"
                }`}
              >
                {fill(t.shift, { n: shift.id })} · {shift.start}
              </span>
              <span className="text-right font-medium text-slate-600">{status ? statusText(status, t) : " "}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${shift.id === 1 ? "bg-gold" : "bg-brand"}`}
                style={{ width: `${Math.round((status ? progressOf(status) : 0) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
      <Link href={scheduleHref} className="mt-1 inline-block text-sm font-bold text-brand link-grow">
        {t.link} →
      </Link>
    </div>
  );
}
