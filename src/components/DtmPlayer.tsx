"use client";

import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { createClient } from "@/lib/supabase/client";
import { clearRun, newRun, parseRun, savedRunSnapshot, subscribeNothing, type RunState } from "@/lib/test-run";
import { dtm, dtmMainSubjects, dtmPresets, type PublicQuestion, type TestSection, type TestSubject } from "@/lib/tests";
import TestRunner from "./TestRunner";
import { ResumeBanner } from "./TestPlayer";

const key = "dtm";

/**
 * The DTM mock exam: pick two main subjects, then 10 questions of each compulsory subject and 30 of each
 * main one are drawn at random from the published DTM banks, with DTM points and a 3-hour clock.
 */
export default function DtmPlayer({ pools, t, href, backHref }: { pools: Record<string, number>; t: Dictionary["tests"]; href: string; backHref: string }) {
  const saved = parseRun(useSyncExternalStore(subscribeNothing, savedRunSnapshot(key), () => null));
  const [first, setFirst] = useState<TestSubject | "">("");
  const [second, setSecond] = useState<TestSubject | "">("");
  const [run, setRun] = useState<{ state: RunState; title: string; n: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, rerender] = useState(0);
  const d = t.dtm;
  const pool = (s: TestSubject) => pools[s] ?? 0;
  const title = (a: string, b: string) => `${d.title}: ${t.subjects[a as TestSubject]} – ${t.subjects[b as TestSubject]}`;

  if (run) {
    return <TestRunner key={run.n} storageKey={key} title={run.title} href={href} backHref={backHref} initial={run.state} t={t} onRestart={() => setRun(null)} />;
  }

  async function start() {
    if (!first || !second) return;
    if (first === second) return setError(d.same);
    setLoading(true);
    setError(null);
    try {
      const need = new Map<TestSubject, number>();
      for (const s of dtm.compulsory) need.set(s, (need.get(s) ?? 0) + dtm.compulsoryCount);
      need.set(first, (need.get(first) ?? 0) + dtm.mainCount);
      need.set(second, (need.get(second) ?? 0) + dtm.mainCount);
      const supabase = createClient();
      const drawn = new Map<TestSubject, PublicQuestion[]>();
      await Promise.all(
        [...need].map(async ([s, n]) => {
          const { data, error } = await supabase.rpc("random_test_questions", { p_subject: s, p_count: n });
          if (error) throw error;
          drawn.set(s, (data ?? []) as PublicQuestion[]);
        }),
      );
      // Compulsory sections take their questions first; a main subject that is also compulsory gets the rest.
      const take = (s: TestSubject, n: number) => (drawn.get(s) ?? []).splice(0, n);
      const sections: TestSection[] = [
        ...dtm.compulsory.map((s) => ({ label: t.subjects[s], subject: s, points: dtm.compulsoryPoints, questions: take(s, dtm.compulsoryCount) })),
        { label: `${t.subjects[first]} — ${d.first}`, subject: first, points: dtm.firstPoints, questions: take(first, dtm.mainCount) },
        { label: `${t.subjects[second]} — ${d.second}`, subject: second, points: dtm.secondPoints, questions: take(second, dtm.mainCount) },
      ].filter((s) => s.questions.length);
      if (!sections.length) throw new Error("empty");
      setRun((r) => ({ state: newRun(sections, "exam", dtm.minutes), title: title(first, second), n: (r?.n ?? 0) + 1 }));
    } catch {
      setError(t.runner.error);
    } finally {
      setLoading(false);
    }
  }

  const select = (value: TestSubject | "", set: (v: TestSubject | "") => void, label: string, other: TestSubject | "") => (
    <label className="block text-sm font-bold text-slate-800">
      {label}
      <select
        value={value}
        onChange={(e) => {
          set(e.target.value as TestSubject | "");
          setError(null);
        }}
        className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] font-medium text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        <option value="">{d.choose}</option>
        {dtmMainSubjects.map((s) => (
          <option key={s} value={s} disabled={!pool(s) || s === other}>
            {t.subjects[s]} ({pool(s) ? fill(d.pool, { n: pool(s) }) : d.noPool})
          </option>
        ))}
      </select>
    </label>
  );
  const short = [...dtm.compulsory, first, second].some((s, i) => s && pool(s as TestSubject) < (i < 3 ? dtm.compulsoryCount : dtm.mainCount));

  return (
    <div>
      {saved && (
        <ResumeBanner
          t={t}
          onResume={() => setRun((r) => ({ state: saved, title: d.title, n: (r?.n ?? 0) + 1 }))}
          onDiscard={() => {
            clearRun(key);
            rerender((n) => n + 1);
          }}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="mb-2 text-sm font-bold text-slate-800">{d.presets}</p>
          <div className="mb-6 flex flex-wrap gap-2">
            {dtmPresets.map(([a, b]) => {
              const on = first === a && second === b;
              return (
                <button
                  key={`${a}-${b}`}
                  type="button"
                  disabled={!pool(a) || !pool(b)}
                  onClick={() => {
                    setFirst(a);
                    setSecond(b);
                    setError(null);
                  }}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-bold transition disabled:opacity-40 ${on ? "border-navy bg-navy text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  {t.subjects[a]} – {t.subjects[b]}
                </button>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {select(first, setFirst, `${d.first} · ${fill(d.each, { p: dtm.firstPoints })}`, second)}
            {select(second, setSecond, `${d.second} · ${fill(d.each, { p: dtm.secondPoints })}`, first)}
          </div>
          {short && first && second && <p className="mt-4 rounded-xl bg-gold-soft p-3 text-sm text-gold-deep">{d.notEnough}</p>}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={start}
            disabled={!first || !second || loading}
            className="press mt-6 w-full rounded-full bg-gold px-6 py-3 font-bold text-[#241703] shadow-lg shadow-gold/30 hover:bg-[#eba53c] disabled:opacity-50 disabled:shadow-none sm:w-auto"
          >
            {loading ? d.loading : `${d.start} →`}
          </button>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="mb-3 font-bold text-slate-900">{d.format}</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {dtm.compulsory.map((s) => (
                <tr key={s}>
                  <td className="py-2 text-slate-700">
                    {t.subjects[s]}
                    <span className="block text-[12px] text-slate-400">
                      {d.compulsory} · {pool(s) ? fill(d.pool, { n: pool(s) }) : d.noPool}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-600">
                    {dtm.compulsoryCount} × {dtm.compulsoryPoints}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 text-slate-700">{first ? t.subjects[first] : d.first}</td>
                <td className="py-2 text-right tabular-nums text-slate-600">
                  {dtm.mainCount} × {dtm.firstPoints}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">{second ? t.subjects[second] : d.second}</td>
                <td className="py-2 text-right tabular-nums text-slate-600">
                  {dtm.mainCount} × {dtm.secondPoints}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
            {fill(d.total, { n: dtm.compulsory.length * dtm.compulsoryCount + 2 * dtm.mainCount, points: dtm.maxScore, h: dtm.minutes / 60 })}
          </p>
          <p className="mt-3 text-[12.5px] text-slate-500">{d.note}</p>
        </aside>
      </div>
    </div>
  );
}
