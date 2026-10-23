import Link from "next/link";

/**
 * "Online services": the pages a parent can finish without coming to the school.
 *
 * These were built one by one and each ended up only in the footer, the sitemap and the site search —
 * `/reference`, `/status`, `/verify` and `/trust` are deliberately not indexed, and the navbar has no
 * room left for them at 1280px in Russian. So the home page is where they are gathered instead.
 */
const icons: Record<string, React.ReactNode> = {
  apply: <><path d="M9 4h7l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 20V5.5" /><path d="M15.5 4v4.5H20M11 13h5M11 16.5h5" /></>,
  reference: <><rect x="4.5" y="3.5" width="15" height="17" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>,
  status: <><circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8 20 20" /></>,
  surveys: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  verify: <><path d="M12 3.5l7 2.8v5.1c0 4-2.9 7.4-7 9.1-4.1-1.7-7-5.1-7-9.1V6.3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  trust: <><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /></>,
};

const tints = [
  "bg-brand-soft text-brand-deep",
  "bg-teal-soft text-[#0c6d62]",
  "bg-gold-soft text-gold-deep",
  "bg-[#fae7e2] text-[#c9553f]",
];

export type Service = { key: string; href: string; label: string; desc: string };

export default function ServiceTiles({ services }: { services: Service[] }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map(({ key, href, label, desc }, i) => (
        <Link
          key={key}
          href={href}
          style={{ animationDelay: `${i * 50}ms` }}
          className="reveal lift group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 sm:p-5"
        >
          <span className={`grid size-10 shrink-0 place-items-center rounded-[12px] transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-6 group-hover:scale-105 ${tints[i % tints.length]}`}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {icons[key]}
            </svg>
          </span>
          <span className="min-w-0">
            <b className="font-display block text-[15.5px] tracking-tight text-slate-900">{label}</b>
            <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{desc}</span>
          </span>
          <span aria-hidden className="ml-auto self-center text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-brand">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );
}
