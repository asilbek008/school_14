"use client";

// The page each book was last read at, in this browser only (localStorage), like "my class".

const KEY = "bookProgress";

export function readProgress(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function saveProgress(id: number, page: number) {
  try {
    const all = readProgress();
    if (page <= 1) delete all[id];
    else all[id] = page;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

/** Stable snapshot for useSyncExternalStore. */
export function progressSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
