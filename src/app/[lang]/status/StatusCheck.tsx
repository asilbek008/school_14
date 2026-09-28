"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import { fill } from "@/i18n/fill";
import { checkStatus, type StatusState } from "./actions";

type Labels = Dictionary["status"];

/** How far along a request is, as a row of steps — the last reached one is marked. */
const steps: Record<"admission" | "reference", string[]> = {
  admission: ["new", "contacted", "accepted"],
  reference: ["new", "ready", "given"],
};

export default function StatusCheck({ t, lang, initial }: { t: Labels; lang: Locale; initial: string }) {
  const [state, action, pending] = useActionState<StatusState, FormData>(checkStatus, { state: "idle" });
  const found = state.found;
  // A refused request has no next step to show; it ends where it is.
  const line = found && found.status !== "declined" ? steps[found.sort] : [];
  const reached = found ? line.indexOf(found.status) : -1;

  return (
    <div className="space-y-6">
      <form action={action} className="flex flex-wrap gap-2 sm:flex-nowrap">
        <input
          name="code"
          defaultValue={state.code ?? initial}
          required
          minLength={6}
          maxLength={40}
          autoComplete="off"
          spellCheck={false}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 rounded-full border border-slate-300 px-5 py-3 text-center text-[16px] font-bold uppercase tracking-[0.12em] text-navy placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
        <button type="submit" disabled={pending} className="press rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-deep disabled:opacity-60">
          {pending ? t.checking : t.check}
        </button>
      </form>

      {state.state === "missing" && (
        <p className="rounded-[14px] bg-[#fae7e2] px-4 py-3 text-sm text-[#c9553f] shadow-[inset_3px_0_0_#c9553f]" role="alert">
          {t.notFound}
        </p>
      )}
      {state.state === "error" && (
        <p className="rounded-[14px] bg-[#fae7e2] px-4 py-3 text-sm text-[#c9553f] shadow-[inset_3px_0_0_#c9553f]" role="alert">
          {t.error}
        </p>
      )}

      {found && (
        <div className="animate-fade-up rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6" role="status">
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-slate-500">
            {found.sort === "admission" ? fill(t.admission, { n: found.kind }) : t.kinds[found.kind as keyof typeof t.kinds] || t.reference}
          </p>
          <p className="mt-1 text-[22px] font-bold text-navy">{t.states[found.status as keyof typeof t.states] ?? found.status}</p>
          <p className="mt-1 text-sm text-slate-600">
            {fill(t.sent, { d: formatDate(found.created_at, lang) })}
            {found.ready_at && ` · ${fill(t.readyOn, { d: formatDate(found.ready_at, lang) })}`}
          </p>

          {line.length > 0 && (
            <ol className="mt-5 grid gap-2 sm:grid-cols-3">
              {line.map((step, i) => (
                <li
                  key={step}
                  className={`rounded-[12px] px-3 py-2.5 text-[13px] font-semibold ${
                    i <= reached ? "bg-teal-soft text-[#0c6d62] shadow-[inset_3px_0_0_var(--color-teal)]" : "bg-paper text-slate-400"
                  }`}
                >
                  {i <= reached ? "✓ " : `${i + 1}. `}
                  {t.states[step as keyof typeof t.states]}
                </li>
              ))}
            </ol>
          )}

          <p className="mt-5 text-[13px] leading-relaxed text-slate-600">{found.status === "declined" ? t.declinedHint : t.hint}</p>
        </div>
      )}
    </div>
  );
}
