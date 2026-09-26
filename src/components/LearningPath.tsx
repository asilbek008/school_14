"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill, plural } from "@/i18n/fill";
import type { BankSubject, BankTopic } from "@/lib/content";
import { isTestSubject, subjectColors } from "@/lib/tests";
import { clearTopicStats, subscribeTopicStats, topicKey, topicLevel, topicStatsSnapshot, type TopicLevel, type TopicStat } from "@/lib/topic-progress";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const hashSnapshot = () => decodeURIComponent(window.location.hash.slice(1)).split("/")[0];

const levelTone: Record<TopicLevel, { dot: string; chip: string }> = {
  new: { dot: "bg-slate-200 text-slate-600", chip: "bg-slate-100 text-slate-600" },
  weak: { dot: "bg-[#e0735c] text-white", chip: "bg-[#fae7e2] text-[#c9553f]" },
  ok: { dot: "bg-gold text-[#241703]", chip: "bg-gold-soft text-gold-deep" },
  mastered: { dot: "bg-teal text-white", chip: "bg-teal-soft text-[#0c6d62]" },
};

/** Easy topics first (average difficulty), bigger topics first among equals: the path "from zero". */
const pathOrder = (a: BankTopic, b: BankTopic) => (a.difficulty ?? 2) - (b.difficulty ?? 2) || b.questions - a.questions || (a.topic < b.topic ? -1 : 1);

/**
 * "O‘quv yo‘li": pick a subject → its topics from easy to hard, each with a short lesson (when written), practice on
 * that topic and the pupil's own result; a personal plan (weak topics first, then the next new ones) and a mock
 * exam at the end. Progress lives in this browser (topic-progress.ts).
 */
export default function LearningPath({
  bank,
  notes,
  t,
  subjectsT,
  lang,
  practiceHref,
  dtmHref,
}: {
  bank: BankSubject[];
  /** "subject|topic" → the lesson text in the page language. */
  notes: Record<string, string>;
  t: Dictionary["tests"]["path"];
  subjectsT: Dictionary["tests"]["subjects"];
  lang: Locale;
  practiceHref: string;
  dtmHref: string;
}) {
  const fromHash = useSyncExternalStore(subscribeHash, hashSnapshot, () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const subject = picked ?? (bank.some((b) => b.subject === fromHash) ? fromHash : (bank[0]?.subject ?? ""));
  const raw = useSyncExternalStore(subscribeTopicStats, topicStatsSnapshot, () => "{}");
  const stats = JSON.parse(raw) as Record<string, TopicStat>;

  const label = (s: string) => (isTestSubject(s) ? subjectsT[s] : s);
  const current = bank.find((b) => b.subject === subject);
  const topics = [...(current?.topics ?? [])].sort(pathOrder);
  const withLevel = topics.map((x, i) => {
    const stat = stats[topicKey(subject, x.topic)];
    return { ...x, step: i + 1, stat, level: topicLevel(stat) };
  });
  const count = (l: TopicLevel) => withLevel.filter((x) => x.level === l).length;
  const done = count("mastered") + count("ok") * 0.5;
  const percent = topics.length ? Math.round((done / topics.length) * 100) : 0;
  const plan = [
    ...withLevel.filter((x) => x.level === "weak").sort((a, b) => a.stat!.c / a.stat!.n - b.stat!.c / b.stat!.n),
    ...withLevel.filter((x) => x.level === "new"),
    ...withLevel.filter((x) => x.level === "ok"),
  ].slice(0, 3);
  const practice = (topic: string) => `${practiceHref}#${encodeURIComponent(subject)}/${encodeURIComponent(topic)}`;
  const levelName: Record<TopicLevel, string> = { new: t.new, weak: t.weak, ok: t.ok, mastered: t.mastered };

  return (
    <div>
      {/* How it works: lesson → practice → check → mock. */}
      <ol className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {t.steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="font-display text-2xl font-extrabold text-brand">{i + 1}</span>
            <b className="mt-1 block text-[15px] text-slate-900">{s.title}</b>
            <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{s.text}</span>
          </li>
        ))}
      </ol>

      <h2 className="mb-3 mt-9 text-lg font-bold text-slate-900">{t.pick}</h2>
      <div className="flex flex-wrap gap-2">
        {bank.map((b) => {
          const on = b.subject === subject;
          const colors = subjectColors[isTestSubject(b.subject) ? b.subject : "boshqa"];
          return (
            <button
              key={b.subject}
              type="button"
              onClick={() => setPicked(b.subject)}
              aria-pressed={on}
              className={`press relative overflow-hidden rounded-full px-4 py-2 text-[14px] font-bold transition-colors ${on ? "bg-navy text-white shadow" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand"}`}
            >
              <span className={`mr-2 inline-block size-2.5 rounded-full bg-gradient-to-r align-middle ${colors.tile}`} />
              {label(b.subject)}
            </button>
          );
        })}
      </div>

      {current && (
        <>
          {/* The subject at a glance and the personal plan. */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <section className="chrome relative overflow-hidden rounded-2xl p-6 text-white">
              <div className="relative">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">{t.progress}</p>
                <div className="mt-2 flex items-end gap-3">
                  <b className="font-display text-5xl font-extrabold leading-none">{percent}%</b>
                  <span className="pb-1 text-[13.5px] text-[#c7d0ea]">{fill(t.topicsOf, { n: topics.length, s: label(subject) })}</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-gradient-to-r from-teal to-gold transition-[width] duration-500" style={{ width: `${percent}%` }} />
                </div>
                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {(["mastered", "ok", "weak", "new"] as const).map((l) => (
                    <div key={l} className="rounded-xl bg-white/[0.07] px-1 py-2">
                      <dt className="text-[11.5px] text-[#c7d0ea]">{levelName[l]}</dt>
                      <dd className="text-lg font-extrabold">{count(l)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-[17px] font-bold text-slate-900">🎯 {t.plan}</h3>
              <p className="mt-0.5 text-[13px] text-slate-500">{t.planText}</p>
              {plan.length ? (
                <ol className="mt-4 space-y-2.5">
                  {plan.map((x, i) => (
                    <li key={x.topic} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[14.5px] text-slate-900">{x.topic}</b>
                        <span className="text-[12.5px] text-slate-500">
                          {x.level === "weak" ? fill(t.weakWhy, { p: Math.round((x.stat!.c / x.stat!.n) * 100) }) : x.level === "new" ? t.newWhy : t.okWhy}
                        </span>
                      </span>
                      <Link href={practice(x.topic)} className="press shrink-0 rounded-full bg-brand-soft px-3.5 py-1.5 text-[13px] font-bold text-brand-deep hover:bg-brand hover:text-white">
                        {t.practice} →
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl bg-teal-soft p-4 text-[14px] font-semibold text-[#0c6d62]">🏆 {t.allDone}</p>
              )}
            </section>
          </div>

          {/* The path itself. */}
          <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">{fill(t.roadTitle, { s: label(subject) })}</h2>
          <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-slate-200">
            {withLevel.map((x) => {
              const note = notes[topicKey(subject, x.topic)];
              const tone = levelTone[x.level];
              return (
                <li key={x.topic} className="relative flex gap-4">
                  <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ring-4 ring-paper ${tone.dot}`}>
                    {x.level === "mastered" ? "✓" : x.step}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <b className="text-[15.5px] text-slate-900">{x.topic}</b>
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${tone.chip}`}>{levelName[x.level]}</span>
                      <span className="text-[12.5px] text-slate-500">
                        {plural(t.questions, x.questions, lang)}
                        {x.difficulty != null && ` · ${t.levels[Math.min(3, Math.max(1, Math.round(x.difficulty))) - 1]}`}
                        {x.stat && ` · ${fill(t.accuracy, { c: x.stat.c, n: x.stat.n })}`}
                      </span>
                      <Link href={practice(x.topic)} className="press ml-auto rounded-full bg-brand px-4 py-1.5 text-[13px] font-bold text-white hover:bg-brand-deep">
                        {t.practice} →
                      </Link>
                    </div>
                    {note ? (
                      <details className="acc group mt-3 rounded-xl bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[13.5px] font-bold text-brand-deep">
                          📘 {t.lesson}
                          <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </summary>
                        <div className="space-y-2 px-3.5 pb-3.5 text-[14.5px] leading-relaxed text-slate-700">
                          {note.split(/\n{2,}/).map((p, i) => (
                            <p key={i} className="whitespace-pre-line">
                              {p}
                            </p>
                          ))}
                        </div>
                      </details>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-slate-400">{t.noLesson}</p>
                    )}
                  </div>
                </li>
              );
            })}
            <li className="relative flex gap-4">
              <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-navy text-lg ring-4 ring-paper">🏁</span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-4 text-white">
                <span>
                  <b className="block text-[15.5px]">{t.mock}</b>
                  <span className="text-[13px] text-[#c7d0ea]">{t.mockText}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Link href={`${practiceHref}#${encodeURIComponent(subject)}`} className="press rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold hover:bg-white/20">
                    {t.mixed}
                  </Link>
                  <Link href={dtmHref} className="press rounded-full bg-gold px-4 py-2 text-[13px] font-bold text-[#241703] hover:bg-[#eba53c]">
                    {t.dtm} →
                  </Link>
                </span>
              </div>
            </li>
          </ol>
          {Object.keys(stats).length > 0 && (
            <button
              type="button"
              onClick={() => confirm(t.resetConfirm) && clearTopicStats()}
              className="mt-6 text-[13px] font-semibold text-slate-500 underline-offset-2 hover:text-[#c9553f] hover:underline"
            >
              {t.reset}
            </button>
          )}
          <p className="mt-2 text-[12.5px] text-slate-400">{t.privacy}</p>
        </>
      )}
    </div>
  );
}
