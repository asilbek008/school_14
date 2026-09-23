import type { Dictionary } from "@/i18n/dictionaries";
import { school } from "@/lib/school";

/** Banner sending parents to the official eMaktab diary (grades and attendance live there, not here). */
export default function EMaktabCard({ t }: { t: Dictionary["emaktab"] }) {
  return (
    <div className="reveal chrome flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="relative flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 21.5h13" />
            <path d="m9 10 2 2 4-4" />
          </svg>
        </span>
        <div>
          <h2 className="text-xl font-bold">{t.title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-300">{t.text}</p>
        </div>
      </div>
      <a
        href={school.eMaktabUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="press group relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-gold px-6 py-3 font-bold text-[#241703] shadow-lg shadow-gold/30 hover:bg-[#eba53c] sm:self-center"
      >
        {t.button}
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        <span className="sr-only">({t.newTab})</span>
      </a>
    </div>
  );
}
