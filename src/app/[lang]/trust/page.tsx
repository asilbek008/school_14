import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import TrustForm from "./TrustForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/trust">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  // Nothing to gain from search engines here, and one less way for the page to be found by accident.
  return { title: dict.trust.title, robots: { index: false } };
}

/** The trust box: a message to the school's leadership that needs no name. */
export default async function TrustPage({ params }: PageProps<"/[lang]/trust">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.trust;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
          <TrustForm t={t} />
        </section>
        <div className="space-y-6">
          <div className="reveal rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
            <b className="block text-slate-900">🔒 {t.privacyTitle}</b>
            {t.privacy}
          </div>
          <div className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">
            <b className="block text-slate-900">{t.urgentTitle}</b>
            {t.urgent}{" "}
            {school.phone && (
              <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-gold-deep link-grow">
                {school.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
