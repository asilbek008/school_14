"use client";

import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { newRun, parseRun, savedRunSnapshot, subscribeNothing, clearRun, type RunMode, type RunState } from "@/lib/test-run";
import type { TestSection } from "@/lib/tests";
import TestRunner from "./TestRunner";

/** Resume banner for an unfinished attempt saved in this browser. */
export function ResumeBanner({ t, onResume, onDiscard }: { t: Dictionary["tests"]; onResume: () => void; onDiscard: () => void }) {
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold text-gold-deep">{t.runner.resume}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onResume} className="press rounded-full bg-gold px-4 py-2 text-sm font-bold text-[#241703] hover:bg-[#eba53c]">
          {t.runner.resumeYes}
        </button>
        <button type="button" onClick={onDiscard} className="press rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold text-gold-deep hover:bg-white/60">
          {t.runner.resumeNo}
        </button>
      </div>
    </div>
  );
}

/** One test: pick practice or exam, then take it (an unfinished attempt can be resumed). */
export default function TestPlayer({
  testId,
  title,
  href,
  backHref,
  sections,
  minutes,
  t,
}: {
  testId: number;
  title: string;
  href: string;
  backHref: string;
  sections: TestSection[];
  minutes: number | null;
  t: Dictionary["tests"];
}) {
  const key = `test-${testId}`;
  const saved = parseRun(useSyncExternalStore(subscribeNothing, savedRunSnapshot(key), () => null));
  const [run, setRun] = useState<{ state: RunState; n: number } | null>(null);
  const [, rerender] = useState(0);

  const start = (mode: RunMode) => setRun((r) => ({ state: newRun(sections, mode, minutes), n: (r?.n ?? 0) + 1 }));

  if (run) {
    return (
      <TestRunner
        key={run.n}
        storageKey={key}
        title={title}
        href={href}
        backHref={backHref}
        initial={run.state}
        t={t}
        onRestart={() => setRun(null)}
      />
    );
  }

  const modes: { mode: RunMode; label: string; hint: string; icon: string }[] = [
    { mode: "practice", label: t.mode.practice, hint: t.mode.practiceHint, icon: "✍️" },
    { mode: "exam", label: t.mode.exam, hint: minutes ? `${t.mode.examHint} (${minutes}′)` : t.mode.examHint, icon: "⏱" },
  ];
  return (
    <div>
      {saved && (
        <ResumeBanner
          t={t}
          onResume={() => setRun((r) => ({ state: saved, n: (r?.n ?? 0) + 1 }))}
          onDiscard={() => {
            clearRun(key);
            rerender((n) => n + 1);
          }}
        />
      )}
      <h2 className="mb-3 text-lg font-bold text-slate-900">{t.mode.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((m) => (
          <button
            key={m.mode}
            type="button"
            onClick={() => start(m.mode)}
            className="lift group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-brand"
          >
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">
              {m.icon}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[17px] text-slate-900">{m.label}</b>
              <span className="mt-0.5 block text-sm text-slate-500">{m.hint}</span>
            </span>
            <span aria-hidden className="self-center text-xl font-bold text-brand transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
