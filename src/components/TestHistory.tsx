"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/lib/format";
import { clearResults, subscribeNothing } from "@/lib/test-run";
import type { TestResult } from "@/lib/tests";

const snapshot = () => {
  try {
    return localStorage.getItem("testResults");
  } catch {
    return null;
  }
};

/** The pupil's last results, from this browser only; nothing when there are none. */
export default function TestHistory({ lang, t }: { lang: Locale; t: Dictionary["tests"] }) {
  const raw = useSyncExternalStore(subscribeNothing, snapshot, () => null);
  const [, rerender] = useState(0);
  let results: TestResult[] = [];
  try {
    results = raw ? (JSON.parse(raw) as TestResult[]).slice(0, 6) : [];
  } catch {}
  if (!results.length) return null;

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900">{t.history.title}</h2>
        <button
          type="button"
          onClick={() => {
            clearResults();
            rerender((n) => n + 1);
          }}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          {t.history.clear}
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const percent = r.max ? Math.round((r.score / r.max) * 100) : 0;
          return (
            <li key={`${r.key}-${r.at}`}>
              <Link href={r.href} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-white ${percent >= 71 ? "bg-[#17a090]" : percent >= 56 ? "bg-[#e0a33e]" : "bg-[#d2664e]"}`}
                >
                  {percent}%
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm text-slate-900">{r.title}</b>
                  <span className="text-[12.5px] text-slate-500">
                    {r.max === r.total ? `${r.correct}/${r.total}` : fill(t.history.score, { score: r.score, max: r.max })} · {formatDate(r.at, lang)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
