import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Home page banner for the tests section and the DTM mock exam. */
export default function TestsCard({ lang, t }: { lang: Locale; t: Dictionary["tests"] }) {
  return (
    <div className="reveal flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold-deep" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2.5" />
            <path d="M8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14.5 8.5H17M14.5 14.5H17" />
          </svg>
        </span>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">{t.homeTitle}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{t.homeText}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2.5">
        <Link href={`/${lang}/tests`} className="press rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-deep">
          {t.homeButton}
        </Link>
        <Link href={`/${lang}/tests/dtm`} className="press rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-[#241703] hover:bg-[#eba53c]">
          🎓 {t.dtm.title}
        </Link>
      </div>
    </div>
  );
}
