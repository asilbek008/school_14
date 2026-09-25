// A test attempt in the pupil's browser: kept in localStorage so a reload (or a phone locking) does not
// lose a 3-hour mock exam, and the finished results list. Nothing here is sent anywhere.

import type { TestResult, TestSection } from "./tests";

export type RunMode = "practice" | "exam";

export type RunState = {
  mode: RunMode;
  sections: TestSection[];
  /** Per question (flattened across sections): the order its options are shown in. */
  order: number[][];
  /** Per question: the chosen option (its original index) or null. */
  answers: (number | null)[];
  current: number;
  startedAt: number;
  /** Minutes; null = no limit. */
  minutes: number | null;
  /** Answers already fetched: question id → correct option and explanation. */
  checked: Record<number, { correct: number; explanation: string | null }>;
  finishedAt: number | null;
};

const runKey = (key: string) => `testRun:${key}`;

function shuffle(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newRun(sections: TestSection[], mode: RunMode, minutes: number | null): RunState {
  const questions = sections.flatMap((s) => s.questions);
  return {
    mode,
    sections,
    order: questions.map((q) => shuffle(q.options.length)),
    answers: questions.map(() => null),
    current: 0,
    startedAt: Date.now(),
    minutes: mode === "exam" ? minutes : null,
    checked: {},
    finishedAt: null,
  };
}

export function saveRun(key: string, run: RunState) {
  try {
    localStorage.setItem(runKey(key), JSON.stringify(run));
  } catch {
    // Storage full or blocked: the attempt just won't survive a reload.
  }
}

export function clearRun(key: string) {
  try {
    localStorage.removeItem(runKey(key));
  } catch {}
}

const resultsKey = "testResults";

export function loadResults(): TestResult[] {
  try {
    const list = JSON.parse(localStorage.getItem(resultsKey) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addResult(result: TestResult) {
  try {
    localStorage.setItem(resultsKey, JSON.stringify([result, ...loadResults()].slice(0, 20)));
  } catch {}
}

export function clearResults() {
  try {
    localStorage.removeItem(resultsKey);
  } catch {}
}

/** The raw saved attempt for a key (re-read on every render; null on the server). */
export function savedRunSnapshot(key: string): () => string | null {
  return () => {
    try {
      return localStorage.getItem(runKey(key));
    } catch {
      return null;
    }
  };
}
/** useSyncExternalStore subscribe: other tabs don't matter here. */
export const subscribeNothing = () => () => {};

/** Parses a raw saved attempt; finished or broken ones count as none. */
export function parseRun(raw: string | null): RunState | null {
  if (!raw) return null;
  try {
    const run = JSON.parse(raw) as RunState;
    return Array.isArray(run.sections) && !run.finishedAt ? run : null;
  } catch {
    return null;
  }
}
