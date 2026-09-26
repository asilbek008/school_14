import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { href: string; label: string };

/**
 * Dark page banner: breadcrumbs (the pages above this one), an optional kicker (a pill, or any control such as the
 * year switcher), title and intro.
 */
export default function PageHeader({ title, intro, kicker, crumbs }: { title: string; intro?: string; kicker?: ReactNode; crumbs?: Crumb[] }) {
  return (
    <div className="chrome tricolor-rule">
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5 animate-fade-in text-[13px] font-semibold text-[#93a0c4]">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-2">
                  <Link href={c.href} className="transition-colors hover:text-white">
                    {c.label}
                  </Link>
                  <span aria-hidden>›</span>
                </li>
              ))}
              <li aria-current="page" className="max-w-[28ch] truncate text-[#c3cce6]">
                {title}
              </li>
            </ol>
          </nav>
        )}
        {typeof kicker === "string" ? (
          <span className="mb-3.5 inline-block animate-fade-up rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-bold">
            {kicker}
          </span>
        ) : (
          // Above the title, so an opened dropdown is not covered by it.
          kicker && <div className="relative z-10 mb-3.5 animate-fade-up">{kicker}</div>
        )}
        <h1 className="font-display max-w-[22ch] animate-fade-up text-3xl font-bold tracking-tight [animation-delay:60ms] sm:text-[44px] sm:leading-[1.1]">{title}</h1>
        {intro && <p className="mt-3 max-w-[60ch] animate-fade-up text-[#bdc6e0] sm:text-base [animation-delay:120ms]">{intro}</p>}
      </div>
    </div>
  );
}
