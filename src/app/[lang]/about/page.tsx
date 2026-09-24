import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getClasses, getPage, getStaff, localized, mediaUrl } from "@/lib/content";
import { currentSchoolYear, school, telHref } from "@/lib/school";
import { shifts } from "@/lib/bells";
import { positionGroup, positionLabel } from "@/lib/positions";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import SectionHead from "@/components/SectionHead";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.about };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

const avatarColors = ["from-brand to-brand-deep", "from-teal to-[#0c6d62]", "from-gold to-gold-deep"];

/**
 * About the school, as in the design mockup: key numbers, the admin-edited text with short facts,
 * the leadership (from the staff list) and the lesson times in short (the full table is /schedule).
 */
export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.about;
  const [page, staff, classes] = await Promise.all([getPage("about"), getStaff(), getClasses()]);
  const body = page ? localized(page, "body", lang) : "";
  const leaders = staff.filter((p) => positionGroup(p.position_uz) === "leaders");
  const year = currentSchoolYear();

  const facts = [
    { value: school.stats.students, label: t.students, bg: "from-[#3e72e8] to-brand-deep" },
    { value: school.stats.staff, label: t.staff, bg: "from-[#17a090] to-[#0c6d62]" },
    { value: classes.length || school.stats.classes, label: t.classes, bg: "from-[#e0a33e] to-gold-deep" },
    { value: shifts.length, label: t.shifts, bg: "from-[#d2664e] to-[#a63b28]" },
  ];
  const quick = [
    { label: t.founded, value: school.foundedLabel[lang] },
    { label: dict.contact.address, value: school.address?.[lang], href: school.mapUrl },
    { label: dict.contact.phone, value: school.phone, href: school.phone && telHref(school.phone) },
    { label: dict.contact.hours, value: school.hours?.[lang] },
  ].filter((r) => r.value);

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        kicker={page ? localized(page, "title", lang) : dict.nav.about}
        title={t.name}
        intro={school.address ? fill(t.lead, { address: school.address[lang], ...year }) : undefined}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {/* Key numbers, as colored tiles. */}
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {facts.map(({ value, label, bg }, i) => (
            <div
              key={label}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`reveal relative overflow-hidden rounded-[14px] bg-gradient-to-br px-5 py-5 text-white after:absolute after:-right-8 after:-top-10 after:size-[120px] after:rounded-full after:bg-white/15 sm:py-6 ${bg}`}
            >
              <b className="font-display block text-[28px] font-extrabold leading-none tracking-tight sm:text-[33px]">{value}</b>
              <span className="mt-1.5 block text-[13px] font-semibold opacity-90 sm:text-[13.5px]">{label}</span>
            </div>
          ))}
        </div>

        {/* The admin-edited text, with short facts beside it. */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="reveal rounded-[14px] border border-slate-200 bg-white p-6 sm:p-7">
            <h2 className="font-display mb-3 text-lg font-bold text-slate-900">{t.overview}</h2>
            {body ? <RichText text={body} /> : <p className="text-slate-500">{dict.common.comingSoon}</p>}
          </section>
          {quick.length > 0 && (
            <aside className="reveal rounded-[14px] border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="font-display mb-1 text-lg font-bold text-slate-900">{t.quick}</h2>
              <dl>
                {quick.map(({ label, value, href }) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0">
                    <dt className="shrink-0 text-slate-500">{label}</dt>
                    <dd className="text-right font-bold text-slate-900">
                      {href ? (
                        <a href={href} className="link-grow hover:text-brand" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>
      </div>

      {leaders.length > 0 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <SectionHead kicker={t.leadersKicker} title={t.leadersTitle} desc={t.leadersDesc} />
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {leaders.map((p, i) => {
                const photo = mediaUrl(p.photo);
                return (
                  // Phones: photo beside the name; from sm up the photo sits on top.
                  <Link
                    key={p.id}
                    href={`/${lang}/staff/${p.id}`}
                    className="reveal lift group flex items-center gap-4 rounded-[14px] border border-slate-200 bg-white p-4 hover:border-slate-300 sm:block sm:p-6"
                  >
                    {photo ? (
                      <Image src={photo} alt="" width={52} height={52} className="size-[52px] shrink-0 rounded-full object-cover sm:mb-3.5" />
                    ) : (
                      <span
                        className={`grid size-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br text-[17px] font-bold text-white transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-6 group-hover:scale-105 sm:mb-3.5 ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {initials(p.full_name)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <b className="font-display block leading-snug text-slate-900 transition-colors group-hover:text-brand">{p.full_name}</b>
                      <span className="mt-1 block text-[13px] text-slate-500 sm:mt-1.5">{positionLabel(p, lang)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Lesson times in short; the full bell table lives on its own page. */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
          <SectionHead kicker={dict.nav.schedule} title={t.bellsTitle} desc={dict.schedule.intro} />
          <div className="grid gap-3.5 md:grid-cols-[1fr_1fr_auto]">
            {shifts.map((shift) => (
              <div key={shift.id} className="reveal rounded-[14px] border border-slate-200 bg-white px-5 py-5 sm:px-6">
                <h3 className="font-display flex flex-wrap items-center gap-2.5 text-lg font-bold text-slate-900">
                  {fill(dict.schedule.shift, { n: shift.id })}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${shift.id === 1 ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"}`}>
                    {fill(t.lessonsFrom, { time: shift.start })}
                  </span>
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">{fill(dict.schedule.grades, { list: shift.grades.join(", ") })}</p>
              </div>
            ))}
            <Link
              href={`/${lang}/schedule`}
              className="reveal press group flex items-center justify-center gap-2 rounded-[14px] bg-navy px-6 py-5 text-sm font-bold text-white hover:bg-brand"
            >
              {t.bellsMore}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
