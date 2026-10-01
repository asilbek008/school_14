"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up to a number the first time it comes on screen.
 *
 * The finished figure is what the server renders and what stays on the page without JavaScript, so
 * the tile never shows a placeholder, never shifts, and a crawler reads the real number. The count
 * only replaces it once the browser has the element in view, and never for a visitor who asked for
 * reduced motion.
 */
export default function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        // Small numbers would be over in a blink and large ones would drag; this keeps every tile
        // in the same short window whether it counts to 6 or to 979.
        const duration = Math.min(1100, 420 + value * 1.4);
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          // Eases out, so the figure slows as it settles rather than stopping dead.
          setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) raf = requestAnimationFrame(step);
        };
        setShown(0);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <b ref={ref} className={className}>
      {shown}
    </b>
  );
}
