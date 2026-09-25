"use client";

import { useLayoutEffect } from "react";

/** The theme the visitor chose, else the system setting — the same rule as the layout's inline script. */
function wantsDark() {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
  } catch {
    return false;
  }
}

/**
 * Keeps <html class="dark"> in line with the saved theme. Switching the language changes the root
 * layout's `lang`, and React rewrites <html>'s class list, dropping the "dark" the inline script added —
 * so the page flipped to light. This puts it back before the browser paints, whatever rewrote it.
 */
export default function ThemeSync() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const apply = () => {
      const dark = wantsDark();
      if (html.classList.contains("dark") !== dark) html.classList.toggle("dark", dark);
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
