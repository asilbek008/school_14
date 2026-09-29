"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import LibraryBrowser, { type LibraryBook } from "./LibraryBrowser";

type T = Dictionary["library"];

/**
 * The library's two shelves, picked rather than scrolled past (owner's request).
 *
 * They used to sit one under the other, and with seventy-odd books on the second one a phone had to
 * travel a long way to learn it was there at all. A visitor now chooses a shelf and sees only that
 * one; each keeps its own grade, subject and language filters, because the two are browsed
 * differently -- a textbook is looked up, a novel is browsed.
 */
export default function LibraryShelves({ books, reading, lang, t }: { books: LibraryBook[]; reading: LibraryBook[]; lang: string; t: T }) {
  const shelves = [
    // The textbook shelf needs no line of its own: the page banner already carries t.intro.
    { key: "darslik" as const, label: t.shelfTextbooks, desc: "", items: books },
    { key: "mutolaa" as const, label: t.readingKicker, desc: t.readingText, items: reading },
  ].filter((s) => s.items.length > 0);

  const [picked, setPicked] = useState(shelves[0]?.key);
  const shelf = shelves.find((s) => s.key === picked) ?? shelves[0];
  if (!shelf) return null;

  return (
    <>
      {/* Only worth a switch when there is something on both shelves. */}
      {shelves.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {shelves.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setPicked(s.key)}
              aria-pressed={s.key === shelf.key}
              className={`press shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors sm:px-4 sm:text-sm ${
                s.key === shelf.key ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand hover:text-brand"
              }`}
            >
              {s.label}
              <span className={`ml-1.5 text-[11.5px] font-semibold ${s.key === shelf.key ? "opacity-70" : "text-slate-400"}`}>{s.items.length}</span>
            </button>
          ))}
        </div>
      )}

      {shelf.desc && <p className="mb-4 max-w-3xl text-[13.5px] leading-relaxed text-slate-500 sm:text-[15px]">{shelf.desc}</p>}

      {/* Keyed, so switching shelves starts the filters fresh instead of carrying a grade the other
          shelf may not have. */}
      <LibraryBrowser key={shelf.key} books={shelf.items} lang={lang} t={t} allLabel={t.allGrades} />
    </>
  );
}
