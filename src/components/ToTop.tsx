"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

/** Round "back to top" button that appears after scrolling down a screen. */
export default function ToTop({ label }: { label: string }) {
  const shown = useSyncExternalStore(subscribe, () => window.scrollY > window.innerHeight, () => false);
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={shown ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={`fixed bottom-5 right-5 z-20 grid size-12 place-items-center rounded-full bg-navy text-white shadow-[0_24px_48px_-20px_rgb(19_26_46/0.6)] ring-1 ring-white/15 transition duration-300 hover:bg-brand ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}
