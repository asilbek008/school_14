import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { mapEmbedUrl, school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import ContactForm from "./ContactForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.contact };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.contact;
  const rows = [
    { label: t.address, value: school.address?.[lang] ?? null, href: school.mapUrl },
    { label: t.phone, value: school.phone, href: school.phone && telHref(school.phone) },
    { label: t.email, value: school.email, href: school.email && `mailto:${school.email}` },
    { label: t.hours, value: school.hours?.[lang] ?? null },
  ];

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={dict.nav.contact} intro={t.intro} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t.info}</h2>
          <dl className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            {rows.map(({ label, value, href }) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">
                  {value ? (
                    href ? (
                      <a
                        href={href}
                        className="text-brand link-grow"
                        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )
                  ) : (
                    <span className="text-slate-400">{t.tbd}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {school.location && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <iframe
                src={mapEmbedUrl(lang)!}
                title={`${t.address}: ${school.address?.[lang] ?? ""}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block aspect-video w-full"
              />
              {school.mapUrl && (
                <a
                  href={school.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3 text-sm font-bold text-brand transition-colors hover:bg-paper"
                >
                  📍 {t.openMap} <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{t.form.title}</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ContactForm t={t.form} />
          </div>
        </section>
      </div>
    </>
  );
}
