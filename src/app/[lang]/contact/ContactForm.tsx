"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { sendContactMessage, type ContactState } from "./actions";

type Labels = Dictionary["contact"]["form"];

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function ContactForm({ t }: { t: Labels }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: "idle",
  });

  if (state.status === "success") {
    return <p className="rounded-lg bg-green-50 p-6 text-green-800" role="status">{t.success}</p>;
  }

  const v = state.values;
  const errorText =
    state.status === "invalid" ? t.invalid : state.status === "needContact" ? t.needContact : state.status === "error" ? t.error : null;

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        {t.name}
        <input name="name" defaultValue={v?.name} required maxLength={200} autoComplete="name" className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.phone} <span className="font-normal text-slate-400">({t.optional})</span>
          <input name="phone" defaultValue={v?.phone} type="tel" maxLength={50} autoComplete="tel" className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.email} <span className="font-normal text-slate-400">({t.optional})</span>
          <input name="email" defaultValue={v?.email} type="email" maxLength={320} autoComplete="email" className={input} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        {t.message}
        <textarea name="message" defaultValue={v?.message} required maxLength={5000} rows={5} className={input} />
      </label>
      {/* Honeypot field, hidden from people and assistive tech. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {errorText && (
        <p className="text-sm text-red-700" role="alert">
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
