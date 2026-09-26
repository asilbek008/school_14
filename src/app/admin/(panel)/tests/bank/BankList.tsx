"use client";

import { useState } from "react";
import Link from "next/link";
import { difficultyLabels } from "@/lib/tests";

export type BankQuestion = {
  id: number;
  test_id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  topic: string | null;
  difficulty: number | null;
  tests: { title_uz: string; subject: string; kind: string; is_published: boolean };
};

const PAGE = 50;
const fold = (s: string) => s.toLowerCase().replace(/[‘’ʻʼ'`]/g, "");
const difficultyTone: Record<number, string> = { 1: "bg-green-100 text-green-800", 2: "bg-amber-100 text-amber-800", 3: "bg-red-100 text-red-800" };

/** The bank's questions with filters: subject, topic, difficulty, missing data, and text search; 50 at a time. */
export default function BankList({ rows, labels }: { rows: BankQuestion[]; labels: Record<string, string> }) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [missing, setMissing] = useState<"" | "topic" | "explanation">("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const subjects = [...new Set(rows.map((r) => r.tests.subject))];
  const inSubject = subject ? rows.filter((r) => r.tests.subject === subject) : rows;
  // Plain code-point order: the server and the browser collate "uz" differently, which would break hydration.
  const topics = [...new Set(inSubject.map((r) => r.topic).filter((t): t is string => !!t))].sort();
  const words = fold(q).split(/\s+/).filter(Boolean);
  const list = inSubject.filter(
    (r) =>
      (!topic || r.topic === topic) &&
      (!difficulty || r.difficulty === difficulty) &&
      (missing !== "topic" || !r.topic) &&
      (missing !== "explanation" || !r.explanation) &&
      words.every((w) => fold(`${r.question} ${r.options.join(" ")} ${r.tests.title_uz}`).includes(w)),
  );
  const reset = () => setShown(PAGE);
  const select = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm font-medium ${on ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`;

  return (
    <section>
      <div className="mb-4 space-y-3 rounded-2xl bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
              reset();
            }}
            className={select}
            aria-label="Fan"
          >
            <option value="">Barcha fanlar</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {labels[s] ?? s} · {rows.filter((r) => r.tests.subject === s).length}
              </option>
            ))}
          </select>
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              reset();
            }}
            className={select}
            aria-label="Mavzu"
            disabled={!topics.length}
          >
            <option value="">Barcha mavzular</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t} · {inSubject.filter((r) => r.topic === t).length}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reset();
            }}
            placeholder="Savol, variant yoki test nomi bo‘yicha qidirish…"
            className={`${select} min-w-56 flex-1`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDifficulty(d);
                reset();
              }}
              className={chip(difficulty === d)}
            >
              {d ? difficultyLabels[d] : "Har qanday qiyinlik"}
            </button>
          ))}
          <span className="mx-1 w-px bg-slate-200" />
          {(
            [
              ["", "Hammasi"],
              ["topic", "Mavzusiz"],
              ["explanation", "Izohsiz"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setMissing(v);
                reset();
              }}
              className={chip(missing === v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-2 text-sm text-slate-500">{list.length} ta savol</p>
      <ul className="space-y-2">
        {list.slice(0, shown).map((r) => (
          <li key={r.id}>
            <Link href={`/admin/tests/${r.test_id}/questions/${r.id}`} className="block rounded-xl bg-white p-4 hover:ring-2 hover:ring-blue-300">
              <p className="line-clamp-2 whitespace-pre-line font-medium text-slate-900">{r.question}</p>
              <p className="mt-1 truncate text-sm text-green-700">✓ {r.options[r.correct]}</p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{labels[r.tests.subject] ?? r.tests.subject}</span>
                {r.topic ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">📚 {r.topic}</span> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">mavzusiz</span>}
                {r.difficulty && <span className={`rounded-full px-2 py-0.5 ${difficultyTone[r.difficulty]}`}>{difficultyLabels[r.difficulty]}</span>}
                <span className="truncate text-slate-500">
                  {r.tests.title_uz}
                  {!r.tests.is_published && " · yashirin"}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {list.length > shown && (
        <button type="button" onClick={() => setShown(shown + PAGE)} className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-blue-700 hover:bg-slate-50">
          Yana {Math.min(PAGE, list.length - shown)} ta ko‘rsatish ({list.length - shown} ta qoldi)
        </button>
      )}
    </section>
  );
}
