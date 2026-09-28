import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import ReferenceForm from "./ReferenceForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/reference">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  // A form holding a child's name: nothing here for search engines.
  return { title: dict.reference.title, robots: { index: false } };
}

/** Ordering a reference from home instead of coming in for it. The school prepares and hands it over. */
export default async function ReferencePage({ params }: PageProps<"/[lang]/reference">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.reference;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.lead} />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
          <ReferenceForm t={t} lang={lang} />
        </section>
        <div className="space-y-6">
          <div className="reveal rounded-[14px] border border-slate-200 bg-white px-5 py-4 text-[13.5px] leading-relaxed text-slate-700">
            <b className="mb-2 block text-slate-900">{t.stepsTitle}</b>
            <ol className="list-decimal space-y-1.5 pl-5">
              {t.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="reveal rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
            <b className="block text-slate-900">🔒 {dict.trust.privacyTitle}</b>
            {t.privacy}
          </div>
          <div className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">
            <b className="block text-slate-900">{t.readyTitle}</b>
            {t.ready}
            {school.phone && (
              <>
                {" "}
                <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-gold-deep link-grow">
                  {school.phone}
                </a>
              </>
            )}
            <Link href={`/${lang}/status`} className="mt-2 block font-bold text-gold-deep link-grow">
              {t.checkLink} →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
