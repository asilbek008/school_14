"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { mediaBaseUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { addResult, clearRun, saveRun, type RunState } from "@/lib/test-run";
import { optionLetters, type PublicQuestion } from "@/lib/tests";
import ResultExtras, { type Leaderboard } from "./ResultExtras";

type T = Dictionary["tests"];

const imageSrc = (path: string) => (/^https?:\/\//.test(path) ? path : `${mediaBaseUrl}/${path}`);

/** "1:05:09" / "4:07". */
function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

async function fetchAnswers(ids: number[]): Promise<RunState["checked"]> {
  const out: RunState["checked"] = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await createClient().rpc("test_answers", { p_ids: ids.slice(i, i + 200) });
    if (error) throw error;
    for (const row of (data ?? []) as { id: number; correct: number; explanation: string | null }[]) {
      out[row.id] = { correct: row.correct, explanation: row.explanation };
    }
  }
  return out;
}

/**
 * Takes a test. Practice: the answer and its explanation after each question. Exam: free navigation,
 * a clock (auto-finish when it runs out), everything checked at the end. The attempt is saved in
 * localStorage as it goes; the answers come from the database only for questions already answered.
 */
export default function TestRunner({
  storageKey,
  title,
  href,
  backHref,
  initial,
  t,
  onRestart,
  leaderboard,
}: {
  storageKey: string;
  title: string;
  href: string;
  /** The tests list, for the "back" button under the result. */
  backHref: string;
  initial: RunState;
  t: T;
  onRestart: () => void;
  /** A regular test (not the DTM mock): exam results may join the class leaderboard. */
  leaderboard?: Leaderboard;
}) {
  const [run, setRun] = useState<RunState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(() => run.sections.flatMap((s) => s.questions), [run.sections]);
  const sectionOf = useMemo(() => run.sections.flatMap((s, i) => s.questions.map(() => i)), [run.sections]);
  const deadline = run.minutes ? run.startedAt + run.minutes * 60_000 : null;
  const done = run.finishedAt != null;

  useEffect(() => {
    if (!done) saveRun(storageKey, run);
  }, [run, done, storageKey]);

  const finish = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      const missing = questions.map((q) => q.id).filter((id) => !(id in run.checked));
      const checked = { ...run.checked, ...(missing.length ? await fetchAnswers(missing) : {}) };
      const finishedAt = Date.now();
      const next = { ...run, checked, finishedAt };
      let correct = 0;
      let score = 0;
      let max = 0;
      questions.forEach((q, i) => {
        const points = run.sections[sectionOf[i]].points;
        max += points;
        if (run.answers[i] != null && checked[q.id]?.correct === run.answers[i]) {
          correct++;
          score += points;
        }
      });
      addResult({ key: storageKey, title, href, correct, total: questions.length, score: round1(score), max: round1(max), at: new Date(finishedAt).toISOString() });
      clearRun(storageKey);
      setRun(next);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [questions, run, sectionOf, storageKey, title, href]);

  // The exam clock; when it runs out the answers are checked as they are.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);
  const [timeUp, setTimeUp] = useState(false);
  useEffect(() => {
    if (!deadline || done) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) {
        clearInterval(id);
        setTimeUp(true);
        finishRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, done]);

  if (done) {
    return (
      <Results
        run={run}
        questions={questions}
        sectionOf={sectionOf}
        t={t}
        timeUp={timeUp}
        onRestart={onRestart}
        backHref={backHref}
        topRef={topRef}
        title={title}
        leaderboard={leaderboard}
      />
    );
  }

  const i = run.current;
  const q = questions[i];
  const section = run.sections[sectionOf[i]];
  const chosen = run.answers[i];
  const feedback = run.mode === "practice" ? run.checked[q.id] : undefined;
  const answeredCount = run.answers.filter((a) => a != null).length;
  const go = (n: number) => {
    setRun((r) => ({ ...r, current: Math.min(Math.max(n, 0), questions.length - 1) }));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const choose = (option: number) => {
    if (feedback) return;
    setRun((r) => ({ ...r, answers: r.answers.map((a, k) => (k === i ? option : a)) }));
  };
  const check = async () => {
    setBusy(true);
    setError(false);
    try {
      const got = await fetchAnswers([q.id]);
      setRun((r) => ({ ...r, checked: { ...r.checked, ...got } }));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const tryFinish = () => {
    const left = questions.length - answeredCount;
    if (left && !confirm(fill(t.runner.confirmFinish, { n: left }))) return;
    finish();
  };
  const last = i === questions.length - 1;
  const remaining = deadline ? deadline - now : null;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progress, section and clock */}
      <div className="sticky top-16 z-10 -mx-4 mb-5 border-b border-slate-200 bg-paper/95 px-4 py-3 backdrop-blur lg:top-[74px]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <div className="min-w-0 text-sm">
            <b className="text-slate-900">{fill(t.runner.of, { n: i + 1, total: questions.length })}</b>
            {run.sections.length > 1 && <span className="ml-2 text-slate-500">· {section.label}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500">{fill(t.runner.answered, { n: answeredCount, total: questions.length })}</span>
            {remaining != null && (
              <span
                aria-label={t.runner.timeLeft}
                className={`rounded-full px-3 py-1 font-mono text-sm font-bold tabular-nums ${remaining < 5 * 60_000 ? "bg-[#fae7e2] text-[#c9553f]" : "bg-brand-soft text-brand-deep"}`}
              >
                ⏱ {clock(remaining)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-brand">{fill(t.runner.question, { n: i + 1 })}</p>
          <QuestionText q={q} />
          <ul className="mt-5 space-y-2.5">
            {run.order[i].map((option, k) => {
              const selected = chosen === option;
              const right = feedback && feedback.correct === option;
              const wrong = feedback && selected && !right;
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => choose(option)}
                    aria-pressed={selected}
                    disabled={!!feedback}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                      right
                        ? "border-[#17a090] bg-teal-soft"
                        : wrong
                          ? "border-[#d2664e] bg-[#fae7e2]"
                          : selected
                            ? "border-brand bg-brand-soft"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        right ? "bg-[#17a090] text-white" : wrong ? "bg-[#d2664e] text-white" : selected ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {optionLetters[k]}
                    </span>
                    <span className="whitespace-pre-line pt-0.5 text-[15px] leading-relaxed text-slate-900">{q.options[option]}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {feedback && (
            <div role="status" className={`mt-5 rounded-xl p-4 text-sm ${chosen === feedback.correct ? "bg-teal-soft text-[#0c6d62]" : "bg-[#fae7e2] text-[#a63b28]"}`}>
              <b className="block">
                {chosen === feedback.correct ? t.runner.correct : fill(t.runner.wrong, { a: optionLetters[run.order[i].indexOf(feedback.correct)] })}
              </b>
              {feedback.explanation && (
                <p className="mt-1.5 whitespace-pre-line text-slate-700">
                  <b>{t.runner.explanation}:</b> {feedback.explanation}
                </p>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {t.runner.error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="press rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              ← {t.runner.prev}
            </button>
            <span className="flex-1" />
            {run.mode === "practice" && !feedback ? (
              <button type="button" onClick={check} disabled={chosen == null || busy} className="press rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50">
                {busy ? t.runner.checking : t.runner.check}
              </button>
            ) : last ? (
              <button type="button" onClick={tryFinish} disabled={busy} className="press rounded-full bg-gold px-5 py-2 text-sm font-bold text-[#241703] hover:bg-[#eba53c] disabled:opacity-50">
                {busy ? t.runner.checking : t.runner.finish}
              </button>
            ) : (
              <button type="button" onClick={() => go(i + 1)} className="press rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-deep">
                {t.runner.next} →
              </button>
            )}
          </div>
        </article>

        {/* Question map: jump to any question; answered ones are filled in. */}
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-44">
          <p className="mb-3 text-sm font-bold text-slate-900">{t.runner.map}</p>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {run.sections.map((s, si) => {
              const from = sectionOf.indexOf(si);
              return (
                <div key={si}>
                  {run.sections.length > 1 && <p className="mb-1.5 text-[12px] font-semibold text-slate-500">{s.label}</p>}
                  <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
                    {s.questions.map((sq, k) => {
                      const n = from + k;
                      const fb = run.mode === "practice" ? run.checked[sq.id] : undefined;
                      const state = fb ? (fb.correct === run.answers[n] ? "right" : "wrong") : run.answers[n] != null ? "answered" : "empty";
                      return (
                        <button
                          key={sq.id}
                          type="button"
                          onClick={() => go(n)}
                          aria-current={n === i ? "step" : undefined}
                          className={`h-8 rounded-md text-[12.5px] font-bold tabular-nums transition ${
                            state === "right"
                              ? "bg-[#17a090] text-white"
                              : state === "wrong"
                                ? "bg-[#d2664e] text-white"
                                : state === "answered"
                                  ? "bg-brand text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          } ${n === i ? "ring-2 ring-gold ring-offset-1" : ""}`}
                        >
                          {n + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={tryFinish} disabled={busy} className="press mt-4 w-full rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-[#241703] hover:bg-[#eba53c] disabled:opacity-50">
            {busy ? t.runner.checking : t.runner.finish}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm(t.runner.confirmQuit)) return;
              clearRun(storageKey);
              onRestart();
            }}
            className="mt-2 w-full rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            {t.runner.quit}
          </button>
        </aside>
      </div>
    </div>
  );
}

function QuestionText({ q }: { q: PublicQuestion }) {
  return (
    <>
      <h2 className="mt-2 whitespace-pre-line text-[17px] font-semibold leading-relaxed text-slate-900 sm:text-lg">{q.question}</h2>
      {q.image && (
        // eslint-disable-next-line @next/next/no-img-element -- question pictures of any size, straight from Storage
        <img src={imageSrc(q.image)} alt="" className="mt-4 max-h-80 rounded-xl border border-slate-200 bg-white object-contain" />
      )}
    </>
  );
}

function Results({
  run,
  questions,
  sectionOf,
  t,
  timeUp,
  onRestart,
  backHref,
  topRef,
  title,
  leaderboard,
}: {
  run: RunState;
  questions: PublicQuestion[];
  sectionOf: number[];
  t: T;
  timeUp: boolean;
  onRestart: () => void;
  backHref: string;
  topRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  leaderboard?: Leaderboard;
}) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const isRight = (k: number) => run.answers[k] != null && run.checked[questions[k].id]?.correct === run.answers[k];
  const correct = questions.filter((_, k) => isRight(k)).length;
  const bySection = run.sections.map((s, si) => {
    const idx = sectionOf.map((x, k) => (x === si ? k : -1)).filter((k) => k >= 0);
    const right = idx.filter(isRight).length;
    return { label: s.label, right, total: idx.length, score: round1(right * s.points), max: round1(idx.length * s.points) };
  });
  const score = round1(bySection.reduce((a, s) => a + s.score, 0));
  const max = round1(bySection.reduce((a, s) => a + s.max, 0));
  const percent = max ? Math.round((score / max) * 100) : 0;
  const verdict = percent >= 86 ? t.result.great : percent >= 71 ? t.result.good : percent >= 56 ? t.result.ok : t.result.low;
  const weighted = run.sections.some((s) => s.points !== 1);

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-6">
      {timeUp && <p className="rounded-xl bg-gold-soft p-3 text-sm font-semibold text-gold-deep">{t.runner.timeUp}</p>}
      <section className="chrome relative overflow-hidden rounded-2xl p-6 text-white sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className="grid size-32 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#e0a33e ${percent * 3.6}deg, rgb(255 255 255 / 0.12) 0)` }}
          >
            <div className="grid size-[104px] place-items-center rounded-full bg-navy">
              <b className="font-display text-3xl font-extrabold">{percent}%</b>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#93a0c4]">{t.result.title}</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold sm:text-3xl">{verdict}</h2>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
              <div>
                <dt className="inline text-[#aeb8d4]">{t.result.correct}: </dt>
                <dd className="inline font-bold">
                  {correct} / {questions.length}
                </dd>
              </div>
              {weighted && (
                <div>
                  <dt className="inline text-[#aeb8d4]">{t.result.score}: </dt>
                  <dd className="inline font-bold">
                    {score} / {max}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-[#aeb8d4]">{t.result.time}: </dt>
                <dd className="inline font-bold">{clock((run.finishedAt ?? run.startedAt) - run.startedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {run.sections.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-bold text-slate-900">{t.result.bySection}</h3>
          <ul className="space-y-3">
            {bySection.map((s) => (
              <li key={s.label}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-800">{s.label}</span>
                  <span className="tabular-nums text-slate-600">
                    {s.right}/{s.total} · <b className="text-slate-900">{s.score}</b> / {s.max}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#17a090]" style={{ width: `${s.total ? (s.right / s.total) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResultExtras
        t={t}
        title={title}
        correct={correct}
        total={questions.length}
        percent={percent}
        finishedAt={run.finishedAt ?? run.startedAt}
        exam={run.mode === "exam"}
        leaderboard={leaderboard}
      />

      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={onRestart} className="press rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep">
          ↻ {t.result.again}
        </button>
        <Link href={backHref} className="press rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {t.result.back}
        </Link>
      </div>

      <section>
        <div className="mb-3 flex gap-2">
          {[false, true].map((w) => (
            <button
              key={String(w)}
              type="button"
              onClick={() => setWrongOnly(w)}
              aria-pressed={wrongOnly === w}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${wrongOnly === w ? "border-navy bg-navy text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {w ? `${t.result.wrongOnly} · ${questions.length - correct}` : `${t.result.all} · ${questions.length}`}
            </button>
          ))}
        </div>
        <ol className="space-y-3">
          {questions.map((q, k) => {
            if (wrongOnly && isRight(k)) return null;
            const answer = run.checked[q.id];
            const chosen = run.answers[k];
            return (
              <li key={q.id} className={`rounded-2xl border bg-white p-5 ${isRight(k) ? "border-slate-200" : "border-[#f0c4b8]"}`}>
                <p className="text-[12.5px] font-bold text-slate-500">
                  {fill(t.runner.question, { n: k + 1 })}
                  {run.sections.length > 1 && ` · ${run.sections[sectionOf[k]].label}`}
                  <span className={`ml-2 ${isRight(k) ? "text-[#0c6d62]" : "text-[#c9553f]"}`}>{isRight(k) ? "✓" : "✗"}</span>
                </p>
                <QuestionText q={q} />
                <ul className="mt-3 space-y-1.5 text-[14.5px]">
                  {run.order[k].map((option, n) => {
                    const right = answer?.correct === option;
                    const mine = chosen === option;
                    return (
                      <li
                        key={option}
                        className={`flex gap-2.5 rounded-lg px-3 py-1.5 ${right ? "bg-teal-soft font-semibold text-[#0c6d62]" : mine ? "bg-[#fae7e2] text-[#a63b28]" : "text-slate-700"}`}
                      >
                        <b>{optionLetters[n]})</b>
                        <span className="whitespace-pre-line">{q.options[option]}</span>
                        {mine && <span className="ml-auto shrink-0 text-[12px] font-semibold">← {t.result.yourAnswer}</span>}
                      </li>
                    );
                  })}
                </ul>
                {chosen == null && <p className="mt-2 text-[13px] font-semibold text-[#c9553f]">{t.result.noAnswer}</p>}
                {answer?.explanation && (
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-[13.5px] text-slate-700">
                    <b>{t.runner.explanation}:</b> {answer.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
