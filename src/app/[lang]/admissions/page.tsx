import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getPage, localized } from "@/lib/content";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import SectionHead from "@/components/SectionHead";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/admissions">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.admissions };
}

const stepColors = ["from-[#3e72e8] to-brand-deep", "from-[#17a090] to-[#0c6d62]", "from-[#e0a33e] to-gold-deep"];

/**
 * Admissions, in the design mockup's style: how to apply in three steps (from the owner's text:
 * call, come in office hours, meet the administration), the admin-edited text and the contacts.
 * No document lists or dates here — only what the school has confirmed.
 */
export default async function AdmissionsPage({ params }: PageProps<"/[lang]/admissions">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.admissions;
  const page = await getPage("admissions");
  const body = page ? localized(page, "body", lang) : "";
  const hours = school.hours?.[lang];
  // Each step now leads somewhere rather than only describing itself (owner's request): call the
  // school, open its place on the map, or read who the administration are. The link is attached
  // before the filter, so dropping a step the school has no detail for cannot shift the others.
  const steps = t.steps
    .map((step, i) => ({
      step,
      href: i === 0 ? (school.phone ? telHref(school.phone) : null) : i === 1 ? school.mapUrl : `/${lang}/about#leaders`,
      external: i === 1,
      color: stepColors[i % stepColors.length],
    }))
    .filter((_, i) => (i === 0 ? school.phone : i === 1 ? hours : true));

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        kicker={dict.nav.school}
        title={page ? localized(page, "title", lang) : dict.nav.admissions}
        intro={t.lead}
      />

      <section className="mx-auto max-w-6xl px-4 pb-4 pt-10 sm:pt-12">
        <SectionHead kicker={t.stepsKicker} title={t.stepsTitle} />
        {/* A phone reads these as three short rows; from md they open out into the mockup's cards. */}
        <ol className="grid gap-2 md:grid-cols-3 md:gap-3.5">
          {steps.map(({ step, href, external, color }, i) => {
            const inside = (
              <>
                <span className={`font-display grid size-9 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br text-base font-extrabold text-white md:mb-4 md:size-11 md:text-lg ${color}`}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="font-display block text-[14.5px] tracking-tight text-slate-900 md:text-[16.5px]">{step.title}</b>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-600 md:mt-1.5 md:text-[14px] md:leading-relaxed">
                    {fill(step.text, { hours: hours ?? "" })}
                  </span>
                </span>
                {href && (
                  <span aria-hidden className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 md:hidden">
                    →
                  </span>
                )}
              </>
            );
            const box = "group flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-3.5 md:block md:p-5 lg:p-6";
            return (
              <li key={step.title} style={{ animationDelay: `${i * 60}ms` }} className="reveal relative">
                {href ? (
                  external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={`lift press ${box}`}>
                      {inside}
                    </a>
                  ) : (
                    <Link href={href} className={`lift press ${box}`}>
                      {inside}
                    </Link>
                  )
                ) : (
                  <div className={box}>{inside}</div>
                )}
                {/* A thin connector between the steps on wide screens. */}
                {i < steps.length - 1 && <span aria-hidden className="absolute -right-[11px] top-[42px] hidden h-0.5 w-2 rounded bg-slate-300 md:block" />}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 pb-12 pt-6 sm:pb-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="reveal rounded-[14px] border border-slate-200 bg-white p-6 sm:p-7">
            <h2 className="font-display mb-3 text-lg font-bold text-slate-900">{t.info}</h2>
            {body ? <RichText text={body} /> : <p className="text-slate-500">{dict.common.comingSoon}</p>}
          </section>
          <p className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">{t.note}</p>
        </div>

        <aside className="reveal rounded-[14px] border border-slate-200 bg-white p-6 sm:p-7">
          <h2 className="font-display mb-1 text-lg font-bold text-slate-900">{t.contactTitle}</h2>
          <dl>
            {[
              { label: dict.contact.phone, value: school.phone, href: school.phone && telHref(school.phone) },
              { label: dict.contact.hours, value: hours },
              { label: dict.contact.address, value: school.address?.[lang], href: school.mapUrl },
            ]
              .filter((r) => r.value)
              .map(({ label, value, href }) => (
                <div key={label} className="border-b border-slate-100 py-3 last:border-0">
                  <dt className="text-[12.5px] font-bold text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">
                    {href ? (
                      <a href={href} className="link-grow hover:text-brand" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {value}
                        {href.startsWith("http") && <span aria-hidden> ↗</span>}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
          </dl>
          <Link
            href={`/${lang}/admissions/apply`}
            className="press mt-4 block rounded-full bg-gradient-to-br from-[#3e72e8] to-brand-deep px-5 py-3.5 text-center text-sm font-bold text-white"
          >
            {dict.apply.openForm} →
          </Link>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {school.phone && (
              <a href={telHref(school.phone)} className="press rounded-full bg-brand px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-deep">
                {t.call}
              </a>
            )}
            <Link
              href={`/${lang}/contact`}
              className="press rounded-full border-[1.5px] border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition-colors hover:border-brand hover:text-brand"
            >
              {t.write}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
