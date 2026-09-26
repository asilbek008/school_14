"use client";

import { useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { canvasToPdf, drawCertificate } from "@/lib/certificate";
import { myClassSnapshot, parseMyClass, subscribeMyClass } from "@/lib/my-class";
import { createClient } from "@/lib/supabase/client";

type T = Dictionary["tests"];

export type Leaderboard = { testId: number; classes: { id: number; label: string }[] };

/** "26.09.2026", Tashkent time — the same in every browser (not all of them know Uzbek month names). */
const day = (ms: number) => new Date(ms + 5 * 3_600_000).toISOString().slice(0, 10).split("-").reverse().join(".");

const sentKey = (testId: number, at: number) => `boardSent:${testId}:${at}`;

/**
 * Under a finished test: a certificate with the pupil's name (made in the browser, the name is not stored), and —
 * for an exam-mode attempt at a regular test — adding the result to the class leaderboard (no name, just the
 * class and the count of right answers; once per attempt).
 */
export default function ResultExtras({
  t,
  title,
  correct,
  total,
  percent,
  finishedAt,
  exam,
  leaderboard,
}: {
  t: T;
  title: string;
  correct: number;
  total: number;
  percent: number;
  finishedAt: number;
  exam: boolean;
  leaderboard?: Leaderboard;
}) {
  const [name, setName] = useState("");
  const [making, setMaking] = useState(false);
  const myClass = parseMyClass(useSyncExternalStore(subscribeMyClass, myClassSnapshot, () => ""));
  const [classId, setClassId] = useState<number | "">("");
  const chosenClass = classId || (myClass && leaderboard?.classes.some((c) => c.id === myClass.id) ? myClass.id : "");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">(() => {
    try {
      return leaderboard && localStorage.getItem(sentKey(leaderboard.testId, finishedAt)) ? "sent" : "idle";
    } catch {
      return "idle";
    }
  });

  async function certificate() {
    if (!name.trim()) return;
    setMaking(true);
    try {
      const c = t.cert;
      const canvas = await drawCertificate({
        school: c.school,
        heading: c.heading,
        lead: c.lead,
        name: name.trim(),
        line: fill(percent >= 56 ? c.passed : c.took, { test: title, percent }),
        details: fill(c.details, { correct, total, date: day(finishedAt) }),
        footer: `${c.school} · ${location.host}`,
        note: c.note,
      });
      const url = URL.createObjectURL(await canvasToPdf(canvas));
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-${name.trim().replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setMaking(false);
    }
  }

  async function addToBoard() {
    if (!leaderboard || !chosenClass) return;
    setState("busy");
    const { error } = await createClient().from("test_results").insert({ test_id: leaderboard.testId, class_id: chosenClass, correct, total });
    if (error) return setState("error");
    try {
      localStorage.setItem(sentKey(leaderboard.testId, finishedAt), "1");
    } catch {}
    setState("sent");
  }

  const input = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <span aria-hidden>📜</span> {t.cert.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t.cert.hint}</p>
        <form
          className="mt-3 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            certificate();
          }}
        >
          <label className="flex-1">
            <span className="sr-only">{t.cert.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t.cert.placeholder} className={input} />
          </label>
          <button
            disabled={!name.trim() || making}
            className="press shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-[#241703] hover:bg-[#eba53c] disabled:opacity-50"
          >
            {making ? t.cert.making : `⬇ ${t.cert.download}`}
          </button>
        </form>
      </section>

      {leaderboard && leaderboard.classes.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <span aria-hidden>🏆</span> {t.board.add}
          </h3>
          {!exam ? (
            <p className="mt-1 text-sm text-slate-500">{t.board.onlyExam}</p>
          ) : state === "sent" ? (
            <p className="mt-2 rounded-xl bg-teal-soft px-3.5 py-2.5 text-sm font-semibold text-teal">✓ {t.board.sent}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">{t.board.addHint}</p>
              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">{t.board.pick}</span>
                  <select value={chosenClass} onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : "")} className={input}>
                    <option value="">{t.board.pick}</option>
                    {leaderboard.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={addToBoard}
                  disabled={!chosenClass || state === "busy"}
                  className="press shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50"
                >
                  {t.board.send}
                </button>
              </div>
              {state === "error" && <p className="mt-2 text-sm font-semibold text-[#c9553f]">{t.board.error}</p>}
            </>
          )}
        </section>
      )}
    </div>
  );
}
