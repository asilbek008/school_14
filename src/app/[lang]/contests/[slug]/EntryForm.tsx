"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { enterContest, type EntryState } from "../actions";

type Labels = Dictionary["contests"];

const input =
  "mt-1.5 w-full rounded-[14px] border border-slate-200 bg-paper px-4 py-3 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-soft";
const label = "block text-[12.5px] font-bold text-slate-500";

/** Signing up for one contest; "another pupil" remounts the form empty (a teacher entering a group). */
export default function EntryForm({ t, slug, from, to }: { t: Labels; slug: string; from: number | null; to: number | null }) {
  const [round, setRound] = useState(0);
  return <Form key={round} t={t} slug={slug} from={from} to={to} again={() => setRound((n) => n + 1)} />;
}

function Form({ t, slug, from, to, again }: { t: Labels; slug: string; from: number | null; to: number | null; again: () => void }) {
  const [state, action, pending] = useActionState<EntryState, FormData>(enterContest, { status: "idle" });
  // Only the grades this contest is for; no point offering the rest.
  const grades = Array.from({ length: (to ?? 11) - (from ?? 1) + 1 }, (_, i) => (from ?? 1) + i).filter((n) => n >= 1 && n <= 11);

  if (state.status === "success") {
    return (
      <div className="animate-fade-up rounded-[14px] bg-teal-soft p-5 shadow-[inset_4px_0_0_var(--color-teal)]" role="status">
        <b className="mb-1 block font-bold text-[#0c6d62]">{t.entry.successTitle}</b>
        <p className="text-sm text-slate-700">{t.entry.success}</p>
        {state.code && <p className="mt-4 select-all rounded-[14px] bg-white px-4 py-3 text-center text-[20px] font-bold tracking-[0.12em] text-navy">{state.code}</p>}
        <button type="button" onClick={again} className="press mt-4 text-sm font-bold text-brand link-grow">
          {t.entry.again}
        </button>
      </div>
    );
  }

  const v = state.values;
  const errorText =
    state.status === "invalid"
      ? t.entry.invalid
      : state.status === "grade"
        ? t.entry.wrongGrade
        : state.status === "closed"
          ? t.entry.closed
          : state.status === "tooMany"
            ? t.entry.tooMany
            : state.status === "error"
              ? t.entry.error
              : null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <label className={label}>
        {t.entry.pupilName} *
        <input name="pupil_name" defaultValue={v?.pupil_name} required minLength={3} maxLength={200} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className={label}>
          {t.entry.grade} *
          {/* Remounted per attempt: React resets a form after an action and a select keeps its old value. */}
          <select key={state.attempt} name="grade" defaultValue={v?.grade || String(grades[0] ?? 1)} className={input}>
            {grades.map((n) => (
              <option key={n} value={n}>
                {fill(t.entry.gradeOption, { n })}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t.entry.letter}
          <input name="class_letter" defaultValue={v?.class_letter} maxLength={2} placeholder="A" className={`${input} w-24 text-center uppercase`} />
        </label>
      </div>
      <label className={label}>
        {t.entry.phone} *
        <input name="parent_phone" defaultValue={v?.parent_phone} type="tel" required minLength={7} maxLength={50} autoComplete="tel" placeholder="+998 __ ___ __ __" className={input} />
      </label>
      <label className={label}>
        {t.entry.teacher} <span className="font-medium text-slate-400">({t.entry.optional})</span>
        <input name="teacher" defaultValue={v?.teacher} maxLength={200} className={input} />
      </label>
      <label className={label}>
        {t.entry.note} <span className="font-medium text-slate-400">({t.entry.optional})</span>
        <textarea name="note" defaultValue={v?.note} maxLength={1000} rows={3} className={`${input} resize-y`} />
      </label>
      {/* Honeypot field, hidden from people and assistive tech. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {errorText && (
        <p className="rounded-[14px] bg-[#fae7e2] px-4 py-3 text-sm text-[#c9553f] shadow-[inset_3px_0_0_#c9553f]" role="alert">
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="press w-full rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? t.entry.sending : t.entry.submit}
      </button>
    </form>
  );
}
