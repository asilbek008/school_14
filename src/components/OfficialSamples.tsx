import type { Dictionary } from "@/i18n/dictionaries";

/** Points to the official sample tests (linked, not copied: they belong to the testing agency). */
export default function OfficialSamples({ t }: { t: Dictionary["tests"] }) {
  return (
    <aside className="mt-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-bold text-slate-900">{t.official.title}</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-slate-600">{t.official.text}</p>
      </div>
      <a
        href="https://uzbmb.uz/page/namuna_testlar"
        target="_blank"
        rel="noopener noreferrer"
        className="press shrink-0 self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-brand hover:bg-slate-50 sm:self-center"
      >
        {t.official.link} ↗
      </a>
    </aside>
  );
}
