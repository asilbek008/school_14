// "Shaxsiy kabinet" (owner's request): the pupil's own progress — finished tests, per-topic counters, the
// chosen class and where they stopped in a book — kept on the server so it follows them from the phone to
// the computer. There is no registration: the parents' bot binds a chat to a key, and the browser keeps the
// key in localStorage. Nothing that identifies the pupil is stored, here or there.

import { createClient } from "@/lib/supabase/client";

const KEY = "cabinetKey";
/** What travels with the pupil; each one is already kept in this browser. */
const PARTS = ["testResults", "topicStats", "myClass", "bookProgress"] as const;

export type CabinetData = Partial<Record<(typeof PARTS)[number], unknown>>;

const read = (name: string): unknown => {
  try {
    const raw = localStorage.getItem(name);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const write = (name: string, value: unknown) => {
  try {
    if (value === undefined || value === null) localStorage.removeItem(name);
    else localStorage.setItem(name, JSON.stringify(value));
  } catch {
    // A private window: the cabinet still works for this visit.
  }
};

export function cabinetKey(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const setCabinetKey = (key: string | null) => write(KEY, key === null ? null : key.replace(/"/g, ""));

/** Everything this browser has. */
export function collect(): CabinetData {
  const data: CabinetData = {};
  for (const part of PARTS) {
    const value = part === "myClass" ? (localStorage.getItem("myClass") ?? undefined) : read(part);
    if (value !== undefined) data[part] = value;
  }
  return data;
}

type Result = { key: string; at: string; [k: string]: unknown };
type Topic = { c: number; n: number; at: number };

/**
 * Puts two sides together without losing anything: results are unique by test and time, a topic keeps the
 * larger count (the same answers may already have been counted here), a book keeps the furthest page, and
 * the class of the device being used wins.
 */
export function merge(mine: CabinetData, theirs: CabinetData): CabinetData {
  const out: CabinetData = { ...theirs, ...mine };

  const results = [...(Array.isArray(mine.testResults) ? (mine.testResults as Result[]) : []), ...(Array.isArray(theirs.testResults) ? (theirs.testResults as Result[]) : [])];
  const seen = new Set<string>();
  out.testResults = results
    .filter((r) => r && typeof r.at === "string" && !seen.has(`${r.key}:${r.at}`) && seen.add(`${r.key}:${r.at}`) !== undefined)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 40);

  const topics: Record<string, Topic> = { ...((theirs.topicStats as Record<string, Topic>) ?? {}) };
  for (const [k, v] of Object.entries((mine.topicStats as Record<string, Topic>) ?? {})) {
    const other = topics[k];
    topics[k] = !other || v.n >= other.n ? v : other;
  }
  out.topicStats = topics;

  const books: Record<string, number> = { ...((theirs.bookProgress as Record<string, number>) ?? {}) };
  for (const [k, v] of Object.entries((mine.bookProgress as Record<string, number>) ?? {})) {
    books[k] = Math.max(Number(v) || 0, Number(books[k]) || 0);
  }
  out.bookProgress = books;

  out.myClass = mine.myClass ?? theirs.myClass;
  return out;
}

/** Writes merged data into this browser. */
export function apply(data: CabinetData) {
  for (const part of PARTS) {
    if (!(part in data)) continue;
    const value = data[part];
    if (part === "myClass") write("myClass", typeof value === "string" ? value : undefined);
    else write(part, value);
  }
  try {
    window.dispatchEvent(new Event("topicstats"));
    window.dispatchEvent(new Event("myclass"));
  } catch {
    // Not a browser: nothing to tell.
  }
}

export type SyncResult = { ok: true; data: CabinetData } | { ok: false; error: "gone" | "failed" };

/** Reads the cabinet, merges it with this browser and writes both sides back. */
export async function syncCabinet(): Promise<SyncResult> {
  const key = cabinetKey();
  if (!key) return { ok: false, error: "gone" };
  const supabase = createClient();
  const { data: loaded, error } = await supabase.rpc("cabinet_load", { p_key: key });
  if (error) return { ok: false, error: "failed" };
  const remote = loaded as { data?: CabinetData; error?: string } | null;
  if (remote?.error === "not_found") {
    setCabinetKey(null);
    return { ok: false, error: "gone" };
  }
  const merged = merge(collect(), remote?.data ?? {});
  apply(merged);
  const { error: saveError } = await supabase.rpc("cabinet_save", { p_key: key, p_data: merged });
  return saveError ? { ok: false, error: "failed" } : { ok: true, data: merged };
}

/** A short summary for the cabinet page. */
export function summary(data: CabinetData) {
  const results = Array.isArray(data.testResults) ? (data.testResults as { correct: number; total: number }[]) : [];
  const topics = Object.values((data.topicStats as Record<string, Topic>) ?? {});
  const answered = topics.reduce((n, t) => n + (Number(t.n) || 0), 0);
  const correct = topics.reduce((n, t) => n + (Number(t.c) || 0), 0);
  const mastered = topics.filter((t) => t.n >= 8 && t.c / t.n >= 0.85).length;
  const best = results.length ? Math.max(...results.map((r) => (r.total ? Math.round((r.correct / r.total) * 100) : 0))) : 0;
  return { tests: results.length, answered, correct, mastered, best, topics: topics.length };
}
