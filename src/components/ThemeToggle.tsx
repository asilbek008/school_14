"use client";

import { useSyncExternalStore } from "react";

// The theme lives on <html class="dark">; the layout's inline script sets it before the first paint.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

/** Sun / moon button: switches between the light and dark theme and remembers the choice. */
export default function ThemeToggle({ t }: { t: { dark: string; light: string } }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => null);
  const label = dark ? t.light : t.dark;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={dark ?? undefined}
      onClick={() => {
        const next = !isDark();
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {}
      }}
      className="grid size-10 shrink-0 place-items-center rounded-xl text-[#c2cbe4] transition-colors hover:bg-white/10 hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        )}
      </svg>
    </button>
  );
}
