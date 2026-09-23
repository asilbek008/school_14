import type { Metadata } from "next";
import Image from "next/image";
import { resolveLang } from "@/i18n/server";
import { getStaff, localized, mediaUrl } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/staff">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.staff };
}

export default async function StaffPage({ params }: PageProps<"/[lang]/staff">) {
  const { lang, dict } = await resolveLang(params);
  const staff = await getStaff();

  return (
    <>
      <PageHeader title={dict.nav.staff} intro={dict.staff.intro} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {staff.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {staff.map((person) => {
              const photo = mediaUrl(person.photo);
              const subject = localized(person, "subject", lang);
              return (
                <li key={person.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-center">
                  <div className="relative aspect-square bg-brand-soft">
                    {photo ? (
                      <Image src={photo} alt={person.full_name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-4xl font-bold text-brand/40">
                        {person.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900">{person.full_name}</p>
                    <p className="text-sm text-brand">{localized(person, "position", lang)}</p>
                    {subject && <p className="text-sm text-slate-500">{subject}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>{dict.staff.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
