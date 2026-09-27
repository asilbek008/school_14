"use client";

import { useActionState, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SurveyQuestion } from "@/lib/content";
import { submitSurvey, type SurveyState } from "./actions";

type Props = {
  surveyId: number;
  questions: (SurveyQuestion & { text: string; options: string[] })[];
  t: Dictionary["surveys"];
};

const box = "size-5 shrink-0 accent-[var(--color-brand)]";

/**
 * The answer form. Which surveys this browser has already answered is kept in localStorage only —
 * a convenience, not a check: the database stores nothing that could identify anyone.
 */
export default function SurveyForm({ surveyId, questions, t }: Props) {
  const [state, action, pending] = useActionState(submitSurvey.bind(null, surveyId), {} as SurveyState);
  const [done, setDone] = useState<boolean | null>(null);

  // Read after the first paint, so the server-rendered form and the first client render match.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setDone(localStorage.getItem(`survey:${surveyId}`) === "1");
      } catch {
        setDone(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [surveyId]);

  useEffect(() => {
    if (!state.ok) return;
    try {
      localStorage.setItem(`survey:${surveyId}`, "1");
    } catch {
      // A private window: the thank-you note is enough.
    }
  }, [state.ok, surveyId]);

  if (state.ok) {
    return (
      <div className="rounded-[14px] bg-teal-soft px-6 py-8 text-center">
        <p className="text-2xl font-extrabold text-teal">✓ {t.thanksTitle}</p>
        <p className="mt-2 text-[14.5px] text-slate-700">{t.thanks}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-[14px] border border-slate-200 bg-white px-6 py-8 text-center">
        <p className="text-[15px] font-semibold text-slate-800">{t.done}</p>
        <button type="button" onClick={() => setDone(false)} className="press mt-3 rounded-full bg-brand px-5 py-2 text-[14px] font-bold text-white">
          {t.again}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="sr-only">{q.text}</legend>
          <p className="text-[15.5px] font-bold text-slate-900">
            <span className="text-brand-deep">{i + 1}.</span> {q.text}
            {q.required && <span className="text-[#c9553f]"> *</span>}
          </p>

          {q.kind === "text" ? (
            <textarea
              name={`q${q.id}`}
              rows={3}
              maxLength={1000}
              placeholder={t.textPlaceholder}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          ) : q.kind === "scale" ? (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="press grid size-12 cursor-pointer place-items-center rounded-xl border border-slate-300 text-[15px] font-bold text-slate-700 hover:border-brand has-checked:border-brand has-checked:bg-brand has-checked:text-white"
                  >
                    <input type="radio" name={`q${q.id}`} value={n} className="sr-only" />
                    {n}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 flex justify-between text-[12.5px] text-slate-500">
                <span>1 — {t.scaleLow}</span>
                <span>5 — {t.scaleHigh}</span>
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {q.options.map((option, index) => (
                <li key={index}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-800 hover:bg-brand-soft has-checked:bg-brand-soft has-checked:font-semibold">
                    <input type={q.kind === "multi" ? "checkbox" : "radio"} name={`q${q.id}`} value={index} className={box} />
                    {option}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      ))}

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#fae7e2] px-4 py-3 text-[14px] font-semibold text-[#c9553f]">
          {state.error === "required" ? t.required : state.error === "tooMany" ? t.tooMany : t.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="press w-full rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-deep disabled:opacity-60 sm:w-auto">
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
