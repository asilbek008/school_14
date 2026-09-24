"use client";

// The visitor's own class ("my class"), kept in this browser only (localStorage), so the cached pages
// stay the same for everyone and nothing personal leaves the device.

export type MyClass = { id: number; label: string; grade: number };

const KEY = "myClass";
const EVENT = "myclasschange";

export function subscribeMyClass(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The stored value as a string (a stable snapshot for useSyncExternalStore); "" when none. */
export function myClassSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseMyClass(raw: string | null): MyClass | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as MyClass;
    return Number.isSafeInteger(v.id) && typeof v.label === "string" && Number.isInteger(v.grade) ? v : null;
  } catch {
    return null;
  }
}

export function setMyClass(value: MyClass | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
