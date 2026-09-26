"use client";

import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, plural } from "@/i18n/fill";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import { clearRun, newRun, parseRun, savedRunSnapshot, subscribeNothing, type RunMode, type RunState } from "@/lib/test-run";
import { isTestSubject, subjectColors, type PublicQuestion, type TestSubject } from "@/lib/tests";
import type { BankSubject } from "@/lib/content";
import TestRunner from "./TestRunner";
import { ResumeBanner } from "./TestPlayer";

const key = "practice";
const counts = [10, 20, 30] as const;

// The subject chosen on the tests page arrives as the URL hash (#fizika) — the page itself stays static.
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const hashSnapshot = () => decodeURIComponent(window.location.hash.slice(1));

/**
 * "Fan bo‘yicha mashq": a subject (and optionally one topic) from the question bank, 10–30 random questions from
 * every published test of the subject, in practice or exam mode. Nothing is sent anywhere — as in the other tests.
 */
export default function PracticePlayer({ bank, t, lang, href, backHref }: { bank: BankSubject[]; t: Dictionary["tests"]; lang: Locale; href: string; backHref: string }) {
  const p = t.practice;
  const saved = parseRun(useSyncExternalStore(subscribeNothing, savedRunSnapshot(key), () => null));
  const fromHash = useSyncExternalStore(subscribeHash, hashSnapshot, () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const subject = picked ?? (bank.some((b) => b.subject === fromHash) ? fromHash : "");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState<(typeof counts)[number]>(10);
  const [mode, setMode] = useState<RunMode>("practice");
  const [run, setRun] = useState<{ state: RunState; title: string; n: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, rerender] = useState(0);

  const label = (s: string) => (isTestSubject(s) ? t.subjects[s] : s);
  const current = bank.find((b) => b.subject === subject);

  if (run) {
    return <TestRunner key={run.n} storageKey={key} title={run.title} href={href} backHref={backHref} initial={run.state} t={t} onRestart={() => setRun(null)} />;
  }

  async function start() {
    if (!subject) return setError(p.pickSubject);
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await createClient().rpc("random_bank_questions", { p_subject: subject, p_count: count, p_topic: topic || null });
      if (error) throw error;
      const questions = (data ?? []) as PublicQuestion[];
      if (!questions.length) throw new Error("empty");
      const title = `${p.runTitle}: ${label(subject)}${topic ? ` — ${topic}` : ""}`;
      const sections = [{ label: label(subject), subject: subject as TestSubject, points: 1, questions }];
      setRun((r) => ({ state: newRun(sections, mode, mode === "exam" ? Math.max(5, Math.round(questions.length * 1.5)) : null), title, n: (r?.n ?? 0) + 1 }));
    } catch {
      setError(t.runner.error);
    } finally {
      setLoading(false);
    }
  }

  const chip = (on: boolean) =>
    `press rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${on ? "bg-brand text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand"}`;

  return (
    <div>
      {saved && (
        <ResumeBanner
          t={t}
          onResume={() => setRun((r) => ({ state: saved, title: p.runTitle, n: (r?.n ?? 0) + 1 }))}
          onDiscard={() => {
            clearRun(key);
            rerender((n) => n + 1);
          }}
        />
      )}

      <h2 className="mb-3 text-lg font-bold text-slate-900">{p.subject}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {bank.map((b) => {
          const on = b.subject === subject;
          const colors = subjectColors[isTestSubject(b.subject) ? b.subject : "boshqa"];
          return (
            <button
              key={b.subject}
              type="button"
              onClick={() => {
                setPicked(b.subject);
                setTopic("");
                setError(null);
              }}
              aria-pressed={on}
              className={`lift relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-colors ${on ? "border-brand ring-2 ring-brand/30" : "border-slate-200 hover:border-slate-300"}`}
            >
              <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${colors.tile}`} />
              <b className="block text-[15px] text-slate-900">{label(b.subject)}</b>
              <span className="mt-0.5 block text-[12.5px] text-slate-500">
                {plural(t.questions, b.total, lang)} · {fill(p.topics, { n: b.topics.length })}
              </span>
            </button>
          );
        })}
      </div>

      {current && current.topics.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-lg font-bold text-slate-900">{p.topic}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTopic("")} className={chip(!topic)}>
              {p.allTopics} · {current.total}
            </button>
            {current.topics.map((x) => (
              <button key={x.topic} type="button" onClick={() => setTopic(x.topic)} className={chip(topic === x.topic)}>
                {x.topic} · {x.questions}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-900">{p.count}</h2>
          <div className="flex gap-2">
            {counts.map((n) => (
              <button key={n} type="button" onClick={() => setCount(n)} className={chip(count === n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-900">{p.mode}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("practice")} className={chip(mode === "practice")}>
              ✍️ {t.mode.practice}
            </button>
            <button type="button" onClick={() => setMode("exam")} className={chip(mode === "exam")}>
              ⏱ {t.mode.exam}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={start}
          disabled={loading}
          className="press inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-bold text-white shadow-lg shadow-brand/25 hover:bg-brand-deep disabled:opacity-60"
        >
          {loading ? p.loading : `${p.start} →`}
        </button>
        {error && <p className="text-sm font-semibold text-[#c9553f]">{error}</p>}
      </div>
    </div>
  );
}
