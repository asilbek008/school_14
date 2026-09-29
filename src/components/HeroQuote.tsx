"use client";

import { useEffect, useState } from "react";

/** How long one quote holds the hero (owner's choice): long enough to be read, not so long it never changes. */
const WINDOW = 10 * 60 * 1000;

export type Quote = { text: string; author?: string };

/**
 * The hero heading, cycling through the school's quotes every ten minutes.
 *
 * The server always renders the first one -- the school's own motto -- so the page ships with a real
 * h1 that never changes for a crawler, and there is nothing for hydration to disagree about. The
 * browser then picks by the clock: everyone looking at the site in the same ten-minute window sees
 * the same quote, and it turns over on the window boundary rather than ten minutes after each
 * visitor happened to arrive.
 */
export default function HeroQuote({ quotes, className = "" }: { quotes: Quote[]; className?: string }) {
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const pick = () => setAt(Math.floor(Date.now() / WINDOW) % quotes.length);
    pick();

    // Line up with the boundary first, then keep to the window.
    let every: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      pick();
      every = setInterval(pick, WINDOW);
    }, WINDOW - (Date.now() % WINDOW));

    return () => {
      clearTimeout(first);
      if (every) clearInterval(every);
    };
  }, [quotes.length]);

  const quote = quotes[at] ?? quotes[0];
  if (!quote) return null;

  return (
    <h1 className={className}>
      {/* Keyed on the quote, so each one arrives with the same rise the hero already uses. */}
      <span key={at} className="block animate-fade-up [animation-duration:0.55s]">
        {/* One sentence per line, so a quote does not break mid-thought. */}
        {quote.text.split(/(?<=[.!?])\s+/).map((sentence, i) => (
          <span key={i} className="block">
            {sentence}
          </span>
        ))}
        {quote.author && (
          <span className="mt-3 block font-sans text-[15px] font-semibold tracking-normal text-gold sm:text-base xl:mt-4 xl:text-[17px]">
            — {quote.author}
          </span>
        )}
      </span>
    </h1>
  );
}
