"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";

export type NavIcon = "info" | "door" | "bell" | "star" | "question" | "phone" | "grade" | "calendar" | "history" | "photo" | "repeat" | "doc" | "trophy" | "test" | "book";
export type NavItem = { href: string; label: string; desc: string; icon: NavIcon; color: keyof typeof colors; external?: boolean };
export type NavEntry = { href: string; label: string } | { key: string; label: string; items: NavItem[] };

const colors = {
  blue: "bg-brand-soft text-brand-deep",
  green: "bg-teal-soft text-[#0c6d62]",
  amber: "bg-gold-soft text-gold-deep",
  coral: "bg-[#fae7e2] text-[#c9553f]",
};

const icons: Record<NavIcon, React.ReactNode> = {
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  door: <><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M3 21h18" /><path d="M14 12h.01" /></>,
  bell: <><path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  star: <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.2l5.4-.8z" />,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  grade: <><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6M8 11h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  photo: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="8.5" cy="10" r="1.6" /><path d="M3.6 17.5l4.4-4.2 3.2 3 3-2.7 6.2 5.4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4v3h-4z" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  test: <><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14.5 8.5H17M14.5 14.5H17" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20M8 7h8M8 11h6" /></>,
  repeat: <><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
};

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`size-4 shrink-0 transition-transform duration-300 ease-(--ease-spring) ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Icon = ({ item, size = "size-[38px]" }: { item: NavItem; size?: string }) => (
  <span className={`grid ${size} shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover/item:-rotate-6 group-hover/item:scale-105 ${colors[item.color]}`}>
    <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[item.icon]}
    </svg>
  </span>
);

/** Anchor for an internal page or an external site (eMaktab opens in a new tab). */
function ItemLink({ item, className, onClick, children, newTab }: { item: NavItem; className: string; onClick?: () => void; children: React.ReactNode; newTab: string }) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
        <span className="sr-only"> ({newTab})</span>
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/**
 * Main navigation. Desktop: pill links and dropdowns with an icon and a line of description per page
 * (open on hover, click or keyboard; close on Esc, a click outside or navigation). Mobile: a full-screen
 * panel with collapsible groups, built on <details> so it works before JS loads.
 */
export default function SiteNav({
  home,
  entries,
  labels,
  yearMenu,
  children,
}: {
  home: string;
  entries: NavEntry[];
  labels: { menu: string; newTab: string; extra: NavItem; search: { action: string; label: string } };
  /** The school-year chips at the end of the mobile menu (the top bar with the switcher is hidden on phones). */
  yearMenu?: React.ReactNode;
  /** Shown at the right end, before the mobile menu button (the language switcher). */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The open dropdown remembers the page it was opened on, so navigating closes it without an effect.
  const [open, setOpen] = useState<{ key: string; path: string } | null>(null);
  const openKey = open?.path === pathname ? open.key : null;
  const navRef = useRef<HTMLElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isActive = (href: string) => (href === home ? pathname === home : pathname === href || pathname.startsWith(`${href}/`));
  const groupActive = (items: NavItem[]) => items.some((i) => !i.external && isActive(i.href.split("#")[0]));

  useEffect(() => {
    if (!openKey) return;
    const onPointer = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      navRef.current?.querySelector<HTMLButtonElement>(`[data-dd="${openKey}"]`)?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  const pill = "rounded-full px-3 py-2 transition-colors duration-200 2xl:px-4";
  const pillState = (active: boolean) => (active ? "bg-white text-navy" : "text-[#c2cbe4] hover:bg-white/10 hover:text-white");

  return (
    <>
      {/* Nudged right, towards the buttons (owner's request). */}
      <nav ref={navRef} className="hidden items-center gap-0.5 whitespace-nowrap text-[14.5px] font-semibold lg:ml-auto lg:mr-1 lg:flex xl:mr-4">
        {entries.map((entry) => {
          if ("href" in entry) {
            const active = isActive(entry.href);
            return (
              <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} className={`${pill} ${pillState(active)}`}>
                {entry.label}
              </Link>
            );
          }
          const isOpen = openKey === entry.key;
          const active = groupActive(entry.items);
          return (
            <div
              key={entry.key}
              className="relative"
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                clearTimeout(leaveTimer.current);
                setOpen({ key: entry.key, path: pathname });
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "mouse") return;
                leaveTimer.current = setTimeout(() => setOpen((o) => (o?.key === entry.key ? null : o)), 150);
              }}
            >
              <button
                type="button"
                data-dd={entry.key}
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setOpen(isOpen ? null : { key: entry.key, path: pathname })}
                className={`${pill} flex items-center gap-1.5 ${active ? "bg-white text-navy" : isOpen ? "bg-white/15 text-white" : pillState(false)}`}
              >
                {entry.label} <Chevron className={isOpen ? "rotate-180" : ""} />
              </button>
              <div
                className={`absolute left-1/2 top-full z-50 w-[330px] -translate-x-1/2 pt-3 transition duration-300 ease-(--ease-spring) ${
                  isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                }`}
              >
                <div className="surface rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_26px_50px_-20px_rgb(22_27_51/0.45)]">
                  {entry.items.map((item) => (
                    <ItemLink
                      key={item.href}
                      item={item}
                      newTab={labels.newTab}
                      onClick={() => setOpen(null)}
                      className="group/item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-900 transition-colors hover:bg-paper focus-visible:bg-paper"
                    >
                      <Icon item={item} />
                      <span className="min-w-0">
                        <b className="block text-sm font-bold leading-tight">
                          {item.label}
                          {item.external && <span aria-hidden> ↗</span>}
                        </b>
                        <small className="mt-0.5 block text-[12.5px] font-medium leading-snug text-slate-500">{item.desc}</small>
                      </span>
                    </ItemLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Tighter on phones so the Russian and English names still fit next to the buttons. */}
      <div className="flex items-center gap-1 sm:gap-2">
        {children}
        <MobileMenu className="mobile-nav group lg:hidden">
          <summary
            aria-label={labels.menu}
            className="grid size-9 cursor-pointer list-none place-items-center rounded-xl transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden sm:size-10"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
              <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
            </svg>
          </summary>
          <nav className="surface fixed inset-x-0 bottom-0 top-16 z-40 animate-fade-in overflow-y-auto overscroll-contain bg-paper px-4 pb-10 pt-4 text-slate-900 [animation-duration:0.25s]">
            <div className="mx-auto max-w-xl space-y-2">
              {/* Site search (on phones it is not in the bar). */}
              <form action={labels.search.action} role="search" className="relative mb-3">
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder={labels.search.label}
                  aria-label={labels.search.label}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base outline-none focus:border-brand"
                />
              </form>
              {entries.map((entry) => {
                if ("href" in entry) {
                  const active = isActive(entry.href);
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-2xl border px-5 py-4 text-lg font-bold transition-colors ${
                        active ? "border-navy bg-navy text-white" : "border-slate-200 bg-white hover:border-brand hover:text-brand"
                      }`}
                    >
                      {entry.label}
                    </Link>
                  );
                }
                const active = groupActive(entry.items);
                return (
                  <details key={entry.key} open={active || undefined} className="group/m overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <summary className={`flex cursor-pointer list-none items-center justify-between px-5 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden ${active ? "text-brand" : ""}`}>
                      {entry.label}
                      <Chevron className="size-5 text-slate-400 group-open/m:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 p-2">
                      {entry.items.map((item) => (
                        <ItemLink
                          key={item.href}
                          item={item}
                          newTab={labels.newTab}
                          className={`group/item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-paper ${
                            !item.external && isActive(item.href.split("#")[0]) && !item.href.includes("#") ? "bg-paper text-brand" : ""
                          }`}
                        >
                          <Icon item={item} size="size-9" />
                          <span className="min-w-0">
                            <b className="block text-[15px] font-semibold leading-tight">
                              {item.label}
                              {item.external && <span aria-hidden> ↗</span>}
                            </b>
                            <small className="block text-xs text-slate-500">{item.desc}</small>
                          </span>
                        </ItemLink>
                      ))}
                    </div>
                  </details>
                );
              })}
              <ItemLink
                item={labels.extra}
                newTab={labels.newTab}
                className="group/item flex items-center gap-3 rounded-2xl bg-gold-soft px-4 py-3 font-bold text-gold-deep transition-colors hover:bg-gold hover:text-[#241703]"
              >
                <Icon item={labels.extra} size="size-9" />
                <span>
                  {labels.extra.label} ↗<small className="block text-xs font-medium opacity-80">{labels.extra.desc}</small>
                </span>
              </ItemLink>
              {yearMenu}
            </div>
          </nav>
        </MobileMenu>
      </div>
    </>
  );
}
