import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { getStaffMember, localized, mediaUrl } from "@/lib/content";
import { classLabel } from "@/lib/timetable";
import { avatarGradient, groupBadge, initials, positionGroup, positionLabel } from "@/lib/positions";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/staff/[id]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const person = await getStaffMember(Number((await params).id));
  if (!person) return {};
  const photo = mediaUrl(person.photo);
  return {
    title: person.full_name,
    description: positionLabel(person, lang),
    openGraph: photo ? { images: [photo] } : undefined,
  };
}

export default async function StaffProfilePage({ params }: PageProps<"/[lang]/staff/[id]">) {
  const { lang, dict } = await resolveLang(params);
  const person = await getStaffMember(Number((await params).id));
  if (!person) notFound();
  const t = dict.staff;
  const photo = mediaUrl(person.photo);
  const position = positionLabel(person, lang);
  const bio = localized(person, "bio", lang);

  const facts: [string, React.ReactNode][] = [];
  const subject = localized(person, "subject", lang);
  if (subject) facts.push([t.subject, subject]);
  if (person.school_classes.length) {
    facts.push([
      t.homeroom,
      <span key="classes" className="flex flex-wrap gap-2">
        {person.school_classes.map((c) => (
          <Link key={c.id} href={`/${lang}/timetable/${c.id}`} className="text-brand link-grow">
            {classLabel(c)}
          </Link>
        ))}
      </span>,
    ]);
  }
  const category = localized(person, "category", lang);
  if (category) facts.push([t.category, category]);
  if (person.experience_years != null) facts.push([t.experience, plural(t.years, person.experience_years, lang)]);
  const education = localized(person, "education", lang);
  if (education) facts.push([t.education, education]);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }, { href: `/${lang}/staff`, label: dict.nav.staff }]} title={person.full_name} kicker={position} intro={subject || undefined} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href={`/${lang}/staff`} className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand">
          <span aria-hidden className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
          {t.back}
        </Link>
        <div className="mt-5 grid items-start gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="animate-fade-up rounded-[14px] border border-slate-200 bg-white px-6 py-[26px] text-center">
            {photo ? (
              <div className="relative mx-auto size-[120px] overflow-hidden rounded-full border-4 border-paper sm:size-[150px]">
                <Image src={photo} alt={person.full_name} fill priority sizes="150px" className="object-cover" />
              </div>
            ) : (
              <span
                className={`font-display mx-auto grid size-[120px] place-items-center rounded-full bg-gradient-to-br text-[38px] font-extrabold tracking-tight text-white sm:size-[150px] sm:text-[46px] ${avatarGradient(person.id)}`}
              >
                {initials(person.full_name)}
              </span>
            )}
            <h2 className="font-display mt-[18px] text-[21px] font-bold leading-tight text-slate-900">{person.full_name}</h2>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${groupBadge[positionGroup(person.position_uz)]}`}>{position}</span>
            {(person.phone || person.email) && (
              <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-200 pt-4 text-sm">
                {person.phone && (
                  <a href={`tel:${person.phone.replace(/[^+\d]/g, "")}`} className="flex items-center justify-center gap-2 text-slate-700 hover:text-brand">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                    </svg>
                    {person.phone}
                  </a>
                )}
                {person.email && (
                  <a href={`mailto:${person.email}`} className="flex items-center justify-center gap-2 break-all text-slate-700 hover:text-brand">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5.5" width="18" height="13" rx="3" />
                      <path d="M4 7.5l8 5.5 8-5.5" />
                    </svg>
                    {person.email}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {facts.length > 0 && (
              <dl className="grid gap-4 sm:grid-cols-2">
                {facts.map(([label, value]) => (
                  <div key={label} className="reveal lift rounded-[14px] border border-slate-200 bg-white px-[18px] py-4">
                    <dt className="text-xs font-bold text-slate-500">{label}</dt>
                    <dd className="font-display mt-1.5 font-bold tracking-tight text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {bio && (
              <section className="reveal rounded-[14px] border border-slate-200 bg-white px-6 py-[22px]">
                <h2 className="font-display mb-2.5 text-[17px] font-bold text-slate-900">{t.about}</h2>
                <RichText text={bio} />
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
