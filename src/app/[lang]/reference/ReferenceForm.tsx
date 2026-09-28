"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/fill";
import { orderReference, type ReferenceState } from "./actions";

type Labels = Dictionary["reference"];

const input =
  "mt-1.5 w-full rounded-[14px] border border-slate-200 bg-paper px-4 py-3 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-soft";
const label = "block text-[12.5px] font-bold text-slate-500";
const hint = "mt-1.5 block text-[12.5px] font-medium text-slate-500";
const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const kinds = ["oquvchi", "arxiv", "boshqa"] as const;

/** Ordering a reference; "another one" remounts the form empty (one parent, several papers). */
export default function ReferenceForm({ t, lang }: { t: Labels; lang: Locale }) {
  const [round, setRound] = useState(0);
  return <Form key={round} t={t} lang={lang} again={() => setRound((n) => n + 1)} />;
}

function Form({ t, lang, again }: { t: Labels; lang: Locale; again: () => void }) {
  const [state, action, pending] = useActionState<ReferenceState, FormData>(orderReference, { status: "idle" });

  // The code is shown once — this is the only place the parent can copy it from.
  if (state.status === "success") {
    return (
      <div className="animate-fade-up rounded-[14px] bg-teal-soft p-5 shadow-[inset_4px_0_0_var(--color-teal)]" role="status">
        <b className="mb-1 block font-bold text-[#0c6d62]">{t.successTitle}</b>
        <p className="text-sm text-slate-700">{t.success}</p>
        {state.code && (
          <>
            <p className="mt-4 select-all rounded-[14px] bg-white px-4 py-3 text-center text-[22px] font-bold tracking-[0.12em] text-navy">{state.code}</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-600">{t.keepCode}</p>
            <Link href={`/${lang}/status?code=${encodeURIComponent(state.code)}`} className="press mt-3 inline-block text-sm font-bold text-brand link-grow">
              {t.checkNow} →
            </Link>
          </>
        )}
        <button type="button" onClick={again} className="press mt-4 block text-sm font-bold text-brand link-grow">
          {t.again}
        </button>
      </div>
    );
  }

  const v = state.values;
  const errorText = state.status === "invalid" ? t.invalid : state.status === "error" ? t.error : state.status === "tooMany" ? t.tooMany : null;

  return (
    <form action={action} className="space-y-4">
      <label className={label}>
        {t.kind} *
        {/* Remounted per attempt: React resets a form after an action and a select keeps its old value. */}
        <select key={state.attempt} name="kind" defaultValue={v?.kind || "oquvchi"} className={input}>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {t.kinds[k]}
            </option>
          ))}
        </select>
        <span className={hint}>{t.kindHint}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {t.childName} *
          <input name="child_name" defaultValue={v?.child_name} required minLength={3} maxLength={200} className={input} />
        </label>
        <label className={label}>
          {t.grade} <span className="font-medium text-slate-400">({t.optional})</span>
          <select key={`g${state.attempt}`} name="grade" defaultValue={v?.grade || ""} className={input}>
            <option value="">—</option>
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
        <label className={`${label} sm:col-span-2`}>
          {t.phone} *
          <input name="phone" defaultValue={v?.phone} type="tel" required minLength={7} maxLength={50} autoComplete="tel" placeholder="+998 __ ___ __ __" className={input} />
          <span className={hint}>{t.phoneHint}</span>
        </label>
      </div>
      <label className={label}>
        {t.purpose} <span className="font-medium text-slate-400">({t.optional})</span>
        <input name="purpose" defaultValue={v?.purpose} maxLength={300} placeholder={t.purposePlaceholder} className={input} />
      </label>
      <label className={label}>
        {t.note} <span className="font-medium text-slate-400">({t.optional})</span>
        <textarea name="note" defaultValue={v?.note} maxLength={2000} rows={3} className={`${input} resize-y`} />
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
