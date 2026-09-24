import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { mapEmbedUrl, school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import { tileColors } from "@/components/StatTiles";
import ContactForm from "./ContactForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.contact };
}

const icons: Record<string, ReactNode> = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  pin: <><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.contact;
  const cards = [
    { icon: "phone", label: t.phone, value: school.phone, href: school.phone && telHref(school.phone) },
    { icon: "mail", label: t.email, value: school.email, href: school.email && `mailto:${school.email}` },
    { icon: "pin", label: t.address, value: school.address?.[lang] ?? null, href: school.mapUrl },
    { icon: "clock", label: t.hours, value: school.hours?.[lang] ?? null },
  ];

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={dict.nav.contact} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <h2 className="sr-only">{t.info}</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon, label, value, href }, i) => {
            const external = href?.startsWith("http");
            const body = (
              <>
                <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white/20 transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-6">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {icons[icon]}
                  </svg>
                </span>
                <span className="relative min-w-0">
                  <small className="block text-[12.5px] font-bold opacity-85">{label}</small>
                  <b className={`font-display mt-1 block break-words text-[17px] font-bold leading-snug ${value ? "" : "opacity-70"}`}>
                    {value ?? t.tbd}
                    {external && <span aria-hidden> ↗</span>}
                  </b>
                </span>
              </>
            );
            // Colored tiles, as the number tiles on the other pages. Phones: icon beside the text, so the four
            // cards stay short; from sm up the icon sits on top.
            const box = `reveal group relative flex items-center gap-4 overflow-hidden rounded-[14px] bg-gradient-to-br px-5 py-4 text-white after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 sm:block sm:py-5 sm:[&>span:first-child]:mb-3 ${tileColors[i]}`;
            return value && href ? (
              <a key={label} href={href} style={{ animationDelay: `${i * 60}ms` }} className={`${box} lift`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {body}
              </a>
            ) : (
              <div key={label} style={{ animationDelay: `${i * 60}ms` }} className={box}>
                {body}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="reveal rounded-[14px] border border-slate-200 bg-white p-5 sm:px-7 sm:py-6">
            <h2 className="font-display text-lg font-bold text-slate-900">{t.form.title}</h2>
            <p className="mb-5 mt-1 text-[13.5px] text-slate-500">{t.form.lead}</p>
            <ContactForm t={t.form} />
          </section>

          <div className="space-y-6">
            {/* The trust box, for anyone who would rather not give a name. */}
            <Link
              href={`/${lang}/trust`}
              className="lift group reveal flex items-start gap-3 rounded-[14px] border border-teal/40 bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800"
            >
              <span aria-hidden className="text-lg">🔒</span>
              <span>
                <b className="block text-slate-900 group-hover:text-[#0c6d62]">{dict.trust.title}</b>
                {dict.trust.intro}
              </span>
            </Link>
            {school.phone && (
              <div className="reveal rounded-[14px] bg-gold-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-gold)]">
                <b className="block text-slate-900">{t.quickTitle}</b>
                {t.quickText}{" "}
                <a href={telHref(school.phone)} className="whitespace-nowrap font-bold text-gold-deep link-grow">
                  {school.phone}
                </a>
                .<p className="mt-3">{t.quickNote}</p>
              </div>
            )}
            {school.location && (
              <div className="reveal overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                <iframe
                  src={mapEmbedUrl(lang)!}
                  title={`${t.address}: ${school.address?.[lang] ?? ""}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block aspect-[4/3] w-full"
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
          </div>
        </div>
      </div>
    </>
  );
}
