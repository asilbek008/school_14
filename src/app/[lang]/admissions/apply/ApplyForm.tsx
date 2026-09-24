"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { sendApplication, type ApplyState } from "./actions";

type Labels = Dictionary["apply"];

const input =
  "mt-1.5 w-full rounded-[14px] border border-slate-200 bg-paper px-4 py-3 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-soft";
const label = "block text-[12.5px] font-bold text-slate-500";
const hint = "mt-1.5 block text-[12.5px] font-medium text-slate-500";
const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** The admission form; after a send, "another application" remounts it empty (one parent, several children). */
export default function ApplyForm({ t }: { t: Labels }) {
  const [round, setRound] = useState(0);
  return <Form key={round} t={t} again={() => setRound((n) => n + 1)} />;
}

function Form({ t, again }: { t: Labels; again: () => void }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(sendApplication, { status: "idle" });

  if (state.status === "success") {
    return (
      <div className="animate-fade-up rounded-[14px] bg-teal-soft p-5 shadow-[inset_4px_0_0_var(--color-teal)]" role="status">
        <b className="mb-1 block font-bold text-[#0c6d62]">{t.successTitle}</b>
        <p className="text-sm text-slate-700">{t.success}</p>
        <button type="button" onClick={again} className="press mt-4 text-sm font-bold text-brand link-grow">
          {t.again}
        </button>
      </div>
    );
  }

  const v = state.values;
  const errorText = state.status === "invalid" ? t.invalid : state.status === "badDate" ? t.badDate : state.status === "error" ? t.error : state.status === "tooMany" ? t.tooMany : null;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {t.childName} *
          <input name="child_name" defaultValue={v?.child_name} required minLength={3} maxLength={200} className={input} />
        </label>
        <label className={label}>
          {t.childBirth} *
          <input name="child_birth_date" defaultValue={v?.child_birth_date} type="date" required className={input} />
        </label>
        <label className={label}>
          {t.grade} *
          {/* Remounted per attempt: React resets a form after an action and a select keeps its old value. */}
          <select key={state.attempt} name="grade" defaultValue={v?.grade || "1"} className={input}>
            {grades.map((n) => (
              <option key={n} value={n}>
                {fill(t.gradeOption, { n })}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t.parentName} *
          <input name="parent_name" defaultValue={v?.parent_name} required minLength={3} maxLength={200} autoComplete="name" className={input} />
        </label>
        <label className={label}>
          {t.phone} *
          <input name="phone" defaultValue={v?.phone} type="tel" required minLength={7} maxLength={50} autoComplete="tel" placeholder="+998 __ ___ __ __" className={input} />
        </label>
      </div>
      <label className={label}>
        {t.address} <span className="font-medium text-slate-400">({t.optional})</span>
        <input name="address" defaultValue={v?.address} maxLength={500} className={input} />
        <span className={hint}>{t.addressHint}</span>
      </label>
      <label className={label}>
        {t.previousSchool} <span className="font-medium text-slate-400">({t.optional})</span>
        <input name="previous_school" defaultValue={v?.previous_school} maxLength={300} className={input} />
        <span className={hint}>{t.previousSchoolHint}</span>
      </label>
      <label className={label}>
        {t.note} <span className="font-medium text-slate-400">({t.optional})</span>
        <textarea name="note" defaultValue={v?.note} maxLength={2000} rows={4} placeholder={t.notePlaceholder} className={`${input} resize-y`} />
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
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
