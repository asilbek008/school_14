"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { trustTopics } from "@/lib/categories";
import { sendTrustMessage, type TrustState } from "./actions";

type Labels = Dictionary["trust"];

const input =
  "mt-1.5 w-full rounded-[14px] border border-slate-200 bg-paper px-4 py-3 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-soft";
const label = "block text-[12.5px] font-bold text-slate-500";

/** The trust-box form; after a send it remounts empty, so nothing is left on a shared computer. */
export default function TrustForm({ t }: { t: Labels }) {
  const [round, setRound] = useState(0);
  return <Form key={round} t={t} again={() => setRound((n) => n + 1)} />;
}

function Form({ t, again }: { t: Labels; again: () => void }) {
  const [state, action, pending] = useActionState<TrustState, FormData>(sendTrustMessage, { status: "idle" });

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

  const errorText = state.status === "invalid" ? t.invalid : state.status === "error" ? t.error : state.status === "tooMany" ? t.tooMany : null;

  return (
    <form action={action} className="space-y-4">
      <label className={label}>
        {t.topicLabel}
        {/* Remounted per attempt: React resets a form after an action, and a select keeps its old value. */}
        <select key={state.attempt} name="topic" defaultValue={trustTopics[0]} className={input}>
          {trustTopics.map((k) => (
            <option key={k} value={k}>
              {t.topics[k]}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t.message}
        <textarea name="message" required minLength={10} maxLength={5000} rows={7} placeholder={t.messagePlaceholder} className={`${input} resize-y`} />
      </label>
      <label className={label}>
        {t.contact}
        <input name="contact" maxLength={320} autoComplete="off" className={input} />
        <span className="mt-1.5 block text-[12.5px] font-medium text-slate-500">{t.contactHint}</span>
      </label>
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
