"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, plural } from "@/i18n/fill";
import { myClassSnapshot, parseMyClass, subscribeMyClass } from "@/lib/my-class";
import { progressSnapshot } from "@/lib/book-progress";
import { tileColors } from "./StatTiles";

export type LibraryBook = {
  id: number;
  title: string;
  author: string | null;
  grade: number | null;
  subjectId: number | null;
  subject: string | null;
  language: "uz" | "ru" | "en";
  pages: number | null;
  size: string | null;
  cover: string | null;
  /** The PDF itself (download), and whether it is read here or opened on another site. */
  file: string | null;
  /** Same file with Content-Disposition: attachment (the bucket is on another origin, so `download` alone is ignored). */
  download: string | null;
  external: boolean;
};

type T = Dictionary["library"];
type GradeFilter = number | "all" | "general";

const norm = (s: string) => s.toLowerCase().replace(/[‘’`ʻʼ']/g, "").replace(/ё/g, "е");
const noSubscribe = () => () => {};

/**
 * The e-library: grade chips (preset to the visitor's "my class" grade when it has books), subject and
 * language filters, search, and book cards that open the reader or download the PDF. Each card shows
 * where the reader stopped last time (this browser only).
 */
export default function LibraryBrowser({ books, lang, t, allLabel }: { books: LibraryBook[]; lang: string; t: T; allLabel: string }) {
  const myClass = parseMyClass(useSyncExternalStore(subscribeMyClass, myClassSnapshot, () => ""));
  const progressRaw = useSyncExternalStore(noSubscribe, progressSnapshot, () => "");
  let progress: Record<string, number> = {};
  try {
    progress = progressRaw ? JSON.parse(progressRaw) : {};
  } catch {}

  const grades = [...new Set(books.map((b) => b.grade).filter((g): g is number => g != null))].sort((a, b) => a - b);
  const hasGeneral = books.some((b) => b.grade == null);
  const myGrade = myClass && grades.includes(myClass.grade) ? myClass.grade : null;
  const [picked, setPicked] = useState<GradeFilter | null>(null);
  const grade: GradeFilter = picked ?? myGrade ?? "all";
  const [subject, setSubject] = useState<number | "all">("all");
  const [language, setLanguage] = useState<string>("all");
  const [query, setQuery] = useState("");

  const byGrade = books.filter((b) => (grade === "all" ? true : grade === "general" ? b.grade == null : b.grade === grade));
  const subjects = [...new Map(byGrade.filter((b) => b.subjectId != null).map((b) => [b.subjectId!, b.subject!])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const languages = [...new Set(books.map((b) => b.language))];
  const words = norm(query.trim()).split(/\s+/).filter(Boolean);
  const shown = byGrade.filter(
    (b) =>
      (subject === "all" || b.subjectId === subject) &&
      (language === "all" || b.language === language) &&
      words.every((w) => norm(`${b.title} ${b.author ?? ""} ${b.subject ?? ""}`).includes(w)),
  );
  // With "all grades", books are grouped under grade headings.
  const groups: { key: string; label: string | null; items: LibraryBook[] }[] =
    grade === "all"
      ? [
          ...grades.map((g) => ({ key: String(g), label: fill(t.grade, { n: g }), items: shown.filter((b) => b.grade === g) })),
          { key: "general", label: t.general, items: shown.filter((b) => b.grade == null) },
        ].filter((g) => g.items.length)
      : [{ key: "one", label: null, items: shown }];

  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${on ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`;

  return (
    <div>
      {/* Grades: one scrollable row on phones. */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" onClick={() => setPicked("all")} className={chip(grade === "all")} aria-pressed={grade === "all"}>
          {allLabel}
        </button>
        {grades.map((g) => (
          <button key={g} type="button" onClick={() => { setPicked(g); setSubject("all"); }} className={chip(grade === g)} aria-pressed={grade === g}>
            {fill(t.grade, { n: g })}
            {myGrade === g && " ⭐"}
          </button>
        ))}
        {hasGeneral && (
          <button type="button" onClick={() => { setPicked("general"); setSubject("all"); }} className={chip(grade === "general")} aria-pressed={grade === "general"}>
            {t.general}
          </button>
        )}
      </div>

      <div className="mb-6 grid gap-2.5 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-[15px] text-slate-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value === "all" ? "all" : Number(e.target.value))}
          aria-label={t.subject}
          className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-[15px] font-medium text-slate-800 focus:border-brand focus:outline-none"
        >
          <option value="all">{t.allSubjects}</option>
          {subjects.map(([id, name]) => (
            <option key={id} value={id}>
              {name} · {byGrade.filter((b) => b.subjectId === id).length}
            </option>
          ))}
        </select>
        {languages.length > 1 && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t.language}
            className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-[15px] font-medium text-slate-800 focus:border-brand focus:outline-none"
          >
            <option value="all">{t.allLanguages}</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {t.languages[l]}
              </option>
            ))}
          </select>
        )}
      </div>

      {myGrade && picked == null && <p className="mb-4 text-sm text-slate-500">{fill(t.myClass, { c: myClass!.label })}</p>}

      {groups.length ? (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.key}>
              {g.label && (
                <h2 className="mb-4 flex items-baseline gap-2 text-lg font-bold text-slate-900">
                  {g.label} <span className="text-sm font-medium text-slate-400">· {g.items.length}</span>
                </h2>
              )}
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {g.items.map((b) => (
                  <BookCard key={b.id} b={b} lang={lang} t={t} page={progress[b.id]} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">{t.notFound}</p>
      )}
    </div>
  );
}

function BookCard({ b, lang, t, page }: { b: LibraryBook; lang: string; t: T; page?: number }) {
  const href = b.external ? b.file ?? "#" : `/${lang}/library/${b.id}`;
  const color = tileColors[((b.subjectId ?? b.id) % tileColors.length + tileColors.length) % tileColors.length];
  const cover = (
    <span className="relative block aspect-[3/4] overflow-hidden rounded-t-[14px] bg-slate-100">
      {b.cover ? (
        <Image src={b.cover} alt="" fill sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <span className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-br p-3 text-white ${color}`}>
          <span className="text-[12px] font-bold uppercase tracking-wider opacity-85">{b.subject ?? t.general}</span>
          <span className="font-display text-[15px] font-bold leading-snug">{b.title}</span>
          <span className="font-display text-3xl font-extrabold opacity-90">{b.grade ?? "📚"}</span>
        </span>
      )}
      {page && !b.external && (
        <span className="absolute inset-x-0 bottom-0 bg-navy/85 px-2 py-1 text-center text-[11.5px] font-semibold text-white">
          {fill(t.continue, { n: page })}
        </span>
      )}
    </span>
  );
  return (
    <li className="lift group flex flex-col rounded-[14px] border border-slate-200 bg-white hover:border-slate-300">
      {b.external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${b.title} — ${t.external}`}>
          {cover}
        </a>
      ) : (
        <Link href={href} aria-label={b.title}>
          {cover}
        </Link>
      )}
      <div className="flex flex-1 flex-col p-3">
        <b className="line-clamp-2 text-[14px] leading-snug text-slate-900">{b.title}</b>
        <span className="mt-1 text-[12px] text-slate-500">
          {[b.subject, b.grade && fill(t.grade, { n: b.grade }), b.language !== "uz" && t.languages[b.language]].filter(Boolean).join(" · ")}
        </span>
        {b.author && <span className="mt-0.5 line-clamp-1 text-[12px] text-slate-400">{b.author}</span>}
        <span className="mt-auto flex items-center gap-1.5 pt-3">
          {b.external ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="press flex-1 rounded-full bg-brand px-3 py-1.5 text-center text-[13px] font-bold text-white hover:bg-brand-deep">
              {t.open}
            </a>
          ) : (
            <Link href={href} className="press flex-1 rounded-full bg-brand px-3 py-1.5 text-center text-[13px] font-bold text-white hover:bg-brand-deep">
              {t.read}
            </Link>
          )}
          {b.download && !b.external && (
            <a
              href={b.download}
              aria-label={`${t.download}${b.size ? ` (${b.size})` : ""}`}
              title={`${t.download}${b.size ? ` · ${b.size}` : ""}`}
              className="press grid size-8 shrink-0 place-items-center rounded-full border border-slate-300 text-slate-600 hover:border-brand hover:text-brand"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
            </a>
          )}
        </span>
        {(b.pages || b.size) && (
          <span className="mt-2 text-[11.5px] text-slate-400">{[b.pages && plural(t.pages, b.pages, lang), b.size].filter(Boolean).join(" · ")}</span>
        )}
      </div>
    </li>
  );
}
