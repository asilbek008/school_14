import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { school, telHref } from "@/lib/school";

const links = ["news", "events", "gallery", "about", "schedule", "clubs", "faq", "contact"] as const;

export default function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="chrome text-sm text-slate-400">
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-3 text-white">
            <span className="grid size-10 place-items-center rounded-xl bg-white font-extrabold text-navy">14</span>
            <b className="text-base">{dict.site.name}</b>
          </div>
          <p className="max-w-sm leading-relaxed">{dict.site.description}</p>
          {school.address && <p className="mt-2">{school.address[lang]}</p>}
        </div>
        <div>
          <h2 className="mb-3 font-bold text-white">{dict.footer.contacts}</h2>
          <ul className="space-y-2">
            {school.phone && (
              <li>
                <a href={telHref(school.phone)} className="hover:text-white">{school.phone}</a>
              </li>
            )}
            {school.email && (
              <li>
                <a href={`mailto:${school.email}`} className="hover:text-white">{school.email}</a>
              </li>
            )}
            {school.hours && <li>{school.hours[lang]}</li>}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-bold text-white">{dict.footer.links}</h2>
          <ul className="space-y-2">
            {links.map((item) => (
              <li key={item}>
                <Link href={`/${lang}/${item}`} className="hover:text-white">{dict.nav[item]}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs">
          © {new Date().getFullYear()} {dict.site.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
