// The pupil's progress per topic for the learning path: right answers / answered, kept in this browser only
// (localStorage.topicStats; nothing identifies the pupil and nothing is sent).

export type TopicStat = { c: number; n: number; at: number };
export type TopicLevel = "new" | "weak" | "ok" | "mastered";

const KEY = "topicStats";
const EVENT = "topicstats";

export const topicKey = (subject: string, topic: string) => `${subject}|${topic}`;

export function loadTopicStats(): Record<string, TopicStat> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Adds a finished attempt's answers (only questions with a subject and a topic). */
export function addTopicResults(items: { subject: string; topic: string; ok: boolean }[]) {
  if (!items.length) return;
  const stats = loadTopicStats();
  const at = Date.now();
  for (const { subject, topic, ok } of items) {
    const k = topicKey(subject, topic);
    const s = stats[k] ?? { c: 0, n: 0, at };
    stats[k] = { c: s.c + (ok ? 1 : 0), n: s.n + 1, at };
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function clearTopicStats() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/** Mastered: 85%+ over at least 8 answers; weak: under 60%; a topic needs 3 answers before it is judged. */
export function topicLevel(s: TopicStat | undefined): TopicLevel {
  if (!s || s.n < 3) return "new";
  const p = s.c / s.n;
  if (p >= 0.85 && s.n >= 8) return "mastered";
  return p < 0.6 ? "weak" : "ok";
}

/** useSyncExternalStore: the raw value, re-read when this or another tab writes it. */
export const topicStatsSnapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}";
  }
};
export const subscribeTopicStats = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
