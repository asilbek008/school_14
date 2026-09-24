"use client";

// The school year the visitor picked in the header (a past one), for this browser tab only
// (sessionStorage): news, events and gallery then show that year. Cleared by picking the current year.

const KEY = "siteYear";
const EVENT = "siteyearchange";

export function subscribeSiteYear(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function siteYearSnapshot(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setSiteYear(start: number | null) {
  try {
    if (start == null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(start));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
