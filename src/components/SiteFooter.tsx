import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/fill";
import { currentSchoolYear, school, telHref } from "@/lib/school";
import ToTop from "./ToTop";

const links = ["about", "timetable", "staff", "news", "events", "programs", "achievements", "tests", "library", "alumni", "gallery", "schedule", "calendar", "clubs", "faq", "documents", "contact", "trust", "search"] as const;

export default function SiteFooter({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = currentSchoolYear();
  const link = "inline-block transition duration-200 hover:translate-x-0.5 hover:text-white";

  return (
    <footer className="chrome text-sm text-[#a9b3d0]">
      <div className="relative mx-auto grid max-w-6xl gap-9 px-4 pb-10 pt-14 md:grid-cols-[1.6fr_1.4fr_1fr]">
        <div>
          <Link href={`/${lang}`} className="group/logo mb-4 flex items-center gap-3 text-white">
            <span className="relative grid size-10 place-items-center rounded-xl bg-white font-extrabold tracking-tight text-navy transition-transform duration-300 ease-(--ease-spring) after:absolute after:inset-x-3 after:bottom-1.5 after:h-[3px] after:rounded after:bg-gold group-hover/logo:-rotate-6">
              <span className="-translate-y-0.5">14</span>
            </span>
            <b className="text-[15px] tracking-tight">{dict.site.description}</b>
          </Link>
          <p className="max-w-sm leading-relaxed text-[#8b96b8]">
            {school.address && `${school.address[lang]}. `}
            {fill(dict.footer.tagline, year)}
          </p>
          <a
            href={school.eMaktabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[13px] font-bold text-[#241703] transition-colors hover:bg-[#eba53c]"
          >
            {dict.emaktab.short} ↗<span className="sr-only"> ({dict.emaktab.newTab})</span>
          </a>
        </div>
        <div>
          <h2 className="mb-3.5 text-[14.5px] font-bold text-white">{dict.footer.links}</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {links.map((item) => (
              <li key={item}>
                <Link href={`/${lang}/${item}`} className={link}>
                  {dict.nav[item]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3.5 text-[14.5px] font-bold text-white">{dict.footer.contacts}</h2>
          <ul className="space-y-2.5">
            {school.phone && (
              <li>
                <a href={telHref(school.phone)} className={`${link} font-semibold text-white`}>
                  ☎ {school.phone}
                </a>
              </li>
            )}
            {school.email && (
              <li>
                <a href={`mailto:${school.email}`} className={link}>
                  {school.email}
                </a>
              </li>
            )}
            {school.hours && <li>{school.hours[lang]}</li>}
            {school.address && (
              <li>
                {school.mapUrl ? (
                  <a href={school.mapUrl} target="_blank" rel="noopener noreferrer" className={link}>
                    📍 {school.address[lang]}
                  </a>
                ) : (
                  <>📍 {school.address[lang]}</>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 text-[12.5px] text-[#7a85a8]">
          <span>
            © {fill(dict.footer.year, year)} · {dict.site.name}
          </span>
          <span>{dict.footer.rights}</span>
        </div>
      </div>
      <ToTop label={dict.common.toTop} />
    </footer>
  );
}
