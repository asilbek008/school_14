"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { tileColors } from "./StatTiles";

export type ClassBook = { id: number; title: string; subject: string | null; cover: string | null; href: string; external: boolean; subjectId: number | null };

/**
 * The class's textbooks in the corner of its timetable: a button that opens a list with an
 * "Open PDF" button for each book (the library reader, or the other site for linked books).
 */
export default function ClassBooks({ books, grade, lang, t }: { books: ClassBook[]; grade: number; lang: string; t: Dictionary["timetable"] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a click outside or Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press inline-flex items-center gap-2 rounded-full bg-[#c9553f] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#a63b28]"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20M8 7h8M8 11h6" />
        </svg>
        {t.books}
        <span className="rounded-full bg-white/25 px-1.5 text-xs tabular-nums">{books.length}</span>
      </button>

      {open && (
        <div className="surface absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">{fill(t.booksFor, { n: grade })}</p>
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {books.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="relative block h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                  {b.cover ? (
                    <Image src={b.cover} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className={`absolute inset-0 bg-gradient-to-br ${tileColors[(b.subjectId ?? b.id) % tileColors.length]}`} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="line-clamp-2 text-[13.5px] leading-snug text-slate-900">{b.title}</b>
                  {b.subject && <span className="block text-[12px] text-slate-500">{b.subject}</span>}
                </span>
                {b.external ? (
                  <a href={b.href} target="_blank" rel="noopener noreferrer" className="press shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-deep">
                    {t.openPdf} ↗
                  </a>
                ) : (
                  <Link href={b.href} className="press shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-deep">
                    {t.openPdf}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Link href={`/${lang}/library`} className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-brand hover:bg-slate-50">
            {t.allBooks} →
          </Link>
        </div>
      )}
    </div>
  );
}
