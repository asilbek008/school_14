"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { contactTopics } from "@/lib/categories";
import { sendContactMessage, type ContactState } from "./actions";

type Labels = Dictionary["contact"]["form"];

const input =
  "mt-1.5 w-full rounded-[14px] border border-slate-200 bg-paper px-4 py-3 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-soft";
const label = "block text-[12.5px] font-bold text-slate-500";

/** The contact form; after a successful send, "write another" remounts it empty. */
export default function ContactForm({ t }: { t: Labels }) {
  const [round, setRound] = useState(0);
  return <Form key={round} t={t} again={() => setRound((n) => n + 1)} />;
}

function Form({ t, again }: { t: Labels; again: () => void }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: "idle",
  });

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
  const errorText =
    state.status === "invalid" ? t.invalid : state.status === "needContact" ? t.needContact : state.status === "error" ? t.error : null;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {t.name}
          <input name="name" defaultValue={v?.name} required maxLength={200} autoComplete="name" placeholder={t.namePlaceholder} className={input} />
        </label>
        <label className={label}>
          {t.topic}
          {/* React resets the form after an action and a select ignores a new defaultValue, so it is remounted per attempt. */}
          <select key={state.attempt} name="topic" defaultValue={v?.topic || contactTopics[0]} className={input}>
            {contactTopics.map((k) => (
              <option key={k} value={k}>
                {t.topics[k]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t.phone} <span className="font-medium text-slate-400">({t.optional})</span>
          <input name="phone" defaultValue={v?.phone} type="tel" maxLength={50} autoComplete="tel" placeholder="+998 __ ___ __ __" className={input} />
        </label>
        <label className={label}>
          {t.email} <span className="font-medium text-slate-400">({t.optional})</span>
          <input name="email" defaultValue={v?.email} type="email" maxLength={320} autoComplete="email" placeholder="name@mail.uz" className={input} />
        </label>
      </div>
      <label className={label}>
        {t.message}
        <textarea name="message" defaultValue={v?.message} required maxLength={5000} rows={5} placeholder={t.messagePlaceholder} className={`${input} resize-y`} />
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
        className="press w-full rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)] transition-colors hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
      <p className="text-xs text-slate-500">{t.hint}</p>
    </form>
  );
}
