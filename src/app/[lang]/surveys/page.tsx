import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/lib/format";
import { getSurveys, localized, surveyOpen } from "@/lib/content";
import PageHeader from "@/components/PageHeader";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/surveys">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.surveys.title, description: dict.surveys.intro };
}

/** Open surveys: anonymous questions from the school to parents and pupils. */
export default async function SurveysPage({ params }: PageProps<"/[lang]/surveys">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.surveys;
  const surveys = await getSurveys();

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        {surveys.length ? (
          <ul className="space-y-4">
            {surveys.map((s) => {
              const open = surveyOpen(s);
              return (
                <li key={s.id} className="reveal">
                  <Link
                    href={`/${lang}/surveys/${s.id}`}
                    className="lift group block rounded-[14px] border border-slate-200 bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${open ? "bg-teal-soft text-teal" : "bg-slate-100 text-slate-500"}`}>
                        {open ? t.open : t.closed}
                      </span>
                      <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-bold text-brand-deep">
                        {t.audiences[s.audience as keyof typeof t.audiences] ?? t.audiences.hamma}
                      </span>
                      {open && s.closes_at && <span className="text-[12.5px] text-slate-500">{fill(t.closesAt, { d: formatDate(s.closes_at, lang) })}</span>}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-brand-deep">{localized(s, "title", lang)}</h2>
                    {localized(s, "description", lang) && (
                      <p className="mt-1 line-clamp-2 text-[14.5px] leading-relaxed text-slate-600">{localized(s, "description", lang)}</p>
                    )}
                    <span className="mt-3 inline-block text-[13.5px] font-bold text-brand-deep link-grow">{open ? t.start : t.closed} →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[14px] border border-slate-200 bg-white p-8 text-center text-slate-500">{t.empty}</p>
        )}
        <p className="mt-6 rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
          🔒 {t.privacy}
        </p>
      </div>
    </>
  );
}
