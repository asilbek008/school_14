"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import { fill } from "@/i18n/fill";
import { verifyCertificate, type VerifyState } from "./actions";

type Labels = Dictionary["verify"];

export default function VerifyCheck({ t, lang, initial }: { t: Labels; lang: Locale; initial: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyCertificate, { state: "idle" });
  const cert = state.cert;

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

      {state.state === "unknown" && (
        <div className="rounded-[14px] bg-[#fae7e2] px-5 py-4 shadow-[inset_3px_0_0_#c9553f]" role="alert">
          <b className="block font-bold text-[#c9553f]">✕ {t.unknownTitle}</b>
          <p className="mt-1 text-sm text-slate-700">{t.unknown}</p>
        </div>
      )}
      {state.state === "error" && (
        <p className="rounded-[14px] bg-[#fae7e2] px-4 py-3 text-sm text-[#c9553f] shadow-[inset_3px_0_0_#c9553f]" role="alert">
          {t.error}
        </p>
      )}

      {cert && (
        <div className="animate-fade-up rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6" role="status">
          <b className="block font-bold text-[#0c6d62]">✓ {t.validTitle}</b>
          <p className="mt-3 text-[22px] font-bold text-navy">{cert.name}</p>
          <p className="text-[15px] text-slate-700">{cert.test}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="inline font-bold text-slate-500">{t.result}: </dt>
              <dd className="inline">{fill(t.score, { percent: cert.percent, correct: cert.correct, total: cert.total })}</dd>
            </div>
            <div>
              <dt className="inline font-bold text-slate-500">{t.issued}: </dt>
              <dd className="inline">{formatDate(cert.issued_on, lang)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="inline font-bold text-slate-500">{t.code}: </dt>
              <dd className="inline font-bold tracking-wider text-navy">{cert.code}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-600">{t.practiceNote}</p>
        </div>
      )}
    </div>
  );
}
