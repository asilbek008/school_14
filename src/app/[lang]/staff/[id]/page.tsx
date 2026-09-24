import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { getStaffMember, localized, mediaUrl } from "@/lib/content";
import { classLabel } from "@/lib/timetable";
import { positionLabel } from "@/lib/positions";
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
        <Link href={`/${lang}/staff`} className="text-sm font-bold text-brand link-grow">
          ← {t.back}
        </Link>
        <div className="mt-6 grid items-start gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="relative mx-auto size-40 overflow-hidden rounded-full border-4 border-paper bg-brand-soft">
              {photo ? (
                <Image src={photo} alt={person.full_name} fill priority sizes="160px" className="object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-5xl font-bold text-brand/40">
                  {person.full_name.charAt(0)}
                </span>
              )}
            </div>
            <h2 className="mt-5 text-xl font-bold leading-snug text-slate-900">{person.full_name}</h2>
            <span className="mt-2 inline-block rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal">
              {position}
            </span>
            {(person.phone || person.email) && (
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {person.phone && (
                  <a href={`tel:${person.phone.replace(/[^+\d]/g, "")}`} className="block text-slate-700 hover:text-brand">
                    {person.phone}
                  </a>
                )}
                {person.email && (
                  <a href={`mailto:${person.email}`} className="block break-all text-slate-700 hover:text-brand">
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
                  <div key={label} className="reveal lift rounded-2xl border border-slate-200 bg-white px-5 py-4">
                    <dt className="text-xs font-bold text-slate-500">{label}</dt>
                    <dd className="mt-1 font-bold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {bio && (
              <section className="reveal rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-bold">{t.about}</h2>
                <RichText text={bio} />
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
