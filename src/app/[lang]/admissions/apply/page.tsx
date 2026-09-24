import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import ApplyForm from "./ApplyForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/admissions/apply">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  // A form, not content: nothing for search engines here.
  return { title: dict.apply.title, robots: { index: false } };
}

/** The online admission application. What a parent writes goes to the school only — never onto the site. */
export default async function ApplyPage({ params }: PageProps<"/[lang]/admissions/apply">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.apply;

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/admissions`, label: dict.nav.admissions },
        ]}
        kicker={dict.nav.admissions}
        title={t.title}
        intro={t.lead}
      />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
          <ApplyForm t={t} />
        </section>
        <div className="space-y-6">
          <div className="reveal rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
            <b className="block text-slate-900">🔒 {dict.trust.privacyTitle}</b>
            {t.privacy}
          </div>
          {school.phone && (
            <div className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">
              <b className="block text-slate-900">{dict.admissions.contactTitle}</b>
              <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-gold-deep link-grow">
                {school.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
