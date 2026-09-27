import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/lib/format";
import { getSurvey, localized, surveyOpen, surveyOptions } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import SurveyForm from "./SurveyForm";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/surveys/[id]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const survey = await getSurvey(Number((await params).id));
  if (!survey) return { title: dict.surveys.title };
  return { title: localized(survey, "title", lang), description: localized(survey, "description", lang) || dict.surveys.intro };
}

/** One survey: its questions, answered without signing in and without a name. */
export default async function SurveyPage({ params }: PageProps<"/[lang]/surveys/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.surveys;
  const survey = await getSurvey(Number((await params).id));
  if (!survey) notFound();

  const open = surveyOpen(survey);
  const questions = (survey.questions ?? []).map((q) => ({ ...q, text: localized(q, "question", lang), options: surveyOptions(q, lang) }));

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/surveys`, label: t.title },
        ]}
        kicker={t.audiences[survey.audience as keyof typeof t.audiences] ?? t.audiences.hamma}
        title={localized(survey, "title", lang)}
        intro={open && survey.closes_at ? fill(t.closesAt, { d: formatDate(survey.closes_at, lang) }) : undefined}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        {localized(survey, "description", lang) && (
          <div className="reveal mb-6 text-[15.5px] leading-relaxed text-slate-700">
            <RichText text={localized(survey, "description", lang)} />
          </div>
        )}
        {open ? (
          questions.length ? (
            <SurveyForm surveyId={survey.id} questions={questions} t={t} />
          ) : (
            <p className="rounded-[14px] border border-slate-200 bg-white p-8 text-center text-slate-500">{t.empty}</p>
          )
        ) : (
          <p className="rounded-[14px] bg-gold-soft px-5 py-4 text-[14.5px] text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.closedNote}</p>
        )}
        <p className="mt-6 text-[13px] text-slate-500">🔒 {t.privacy}</p>
      </div>
    </>
  );
}
