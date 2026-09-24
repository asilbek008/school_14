"use client";

import { useState } from "react";
import type { StaffGroup } from "@/lib/positions";
import FilterMenu, { groupDot, matches } from "./StaffFilterMenu";
import Image from "next/image";
import Link from "next/link";

export type StaffRow = {
  id: number;
  name: string;
  position: string;
  positionKey: string; // positionKey() of the Uzbek position, what the filters match
  subjectKey: string; // positionKey() of the Uzbek subject
  group: StaffGroup;
  subject: string | null;
  homeroom: string | null;
  photo: string | null;
};

export type StaffFilters = { group: StaffGroup; items: { value: string; label: string }[] }[];

type Labels = {
  search: string;
  allPositions: string;
  filterLabel: string;
  all: string;
  groups: Record<StaffGroup, string>;
  wholeGroup: string;
  colName: string;
  colPosition: string;
  colSubject: string;
  colClass: string;
  noMatch: string;
};

const avatarColors = ["from-brand to-brand-deep", "from-teal to-[#0c6d62]", "from-gold to-gold-deep"];

/** Badge color by kind of position: leadership blue, teachers green, other staff gold. */
function badge(position: string) {
  const p = position.toLowerCase();
  if (/direktor|директор|director|principal/.test(p)) return "bg-brand-soft text-brand-deep";
  if (/o[‘'`ʻ]?qituvchi|учител|teacher/.test(p)) return "bg-teal-soft text-[#0c6d62]";
  return "bg-gold-soft text-gold-deep";
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

function Avatar({ row, index }: { row: StaffRow; index: number }) {
  return row.photo ? (
    <Image src={row.photo} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[13px] font-bold text-white transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 ${
        avatarColors[index % avatarColors.length]
      }`}
    >
      {initials(row.name)}
    </span>
  );
}

/** Staff table (as in the design mockup): search by name or subject, filter by position; each row opens the profile. */
export default function StaffDirectory({ rows, filters, lang, t }: { rows: StaffRow[]; filters: StaffFilters; lang: string; t: Labels }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(""); // "" | "g:<group>" | "p:<position key>" | "s:<subject match>"
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) => matches(r, filter) && (!q || r.name.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q)),
  );
  const href = (r: StaffRow) => `/${lang}/staff/${r.id}`;
  const count = (value: string) => rows.filter((r) => matches(r, value)).length;
  const tabs = [{ value: "", label: t.all }, ...filters.map((g) => ({ value: `g:${g.group}`, label: t.groups[g.group], group: g.group }))];

  return (
    <div>
      {/* Group tabs: everyone, leadership, teachers, other staff. */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <div role="group" aria-label={t.filterLabel} className="flex w-max gap-2">
          {tabs.map((tab) => {
            const active = filter === tab.value;
            // A single position or subject of this group is chosen in the menu.
            const inGroup = "group" in tab && filters.find((g) => g.group === tab.group)?.items.some((i) => i.value === filter);
            return (
              <button
                key={tab.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(tab.value)}
                className={`press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? "border-navy bg-navy text-white"
                    : inGroup
                      ? "border-brand bg-white text-brand"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
                }`}
              >
                {"group" in tab && <span aria-hidden className={`size-2 rounded-full ${groupDot[tab.group]}`} />}
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{count(tab.value)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2.5 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft"
          />
        </label>
        <FilterMenu value={filter} onChange={setFilter} filters={filters} count={count} t={t} />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">{t.noMatch}</p>
      ) : (
        <>
          {/* Phones: one card per person. */}
          <ul className="space-y-2.5 md:hidden">
            {shown.map((r, i) => (
              <li key={r.id}>
                <Link href={href(r)} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-brand">
                  <Avatar row={r} index={i} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-semibold text-slate-900">{r.name}</b>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${badge(r.position)}`}>{r.position}</span>
                      {r.subject && <span>{r.subject}</span>}
                      {r.homeroom && <span className="font-semibold text-slate-700">· {r.homeroom}</span>}
                    </span>
                  </span>
                  <span aria-hidden className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Larger screens: a table. */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full border-collapse text-left text-[14.5px]">
              <thead className="bg-slate-50">
                <tr className="border-b-2 border-slate-200 text-[11.5px] font-bold text-slate-500">
                  <th scope="col" className="px-5 py-3.5">{t.colName}</th>
                  <th scope="col" className="px-5 py-3.5">{t.colPosition}</th>
                  <th scope="col" className="px-5 py-3.5">{t.colSubject}</th>
                  <th scope="col" className="px-5 py-3.5">{t.colClass}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.id} className="group relative border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-soft/60">
                    <td className="px-5 py-3.5">
                      <Link href={href(r)} className="flex items-center gap-3 font-medium text-slate-900 after:absolute after:inset-0">
                        <Avatar row={r} index={i} />
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${badge(r.position)}`}>{r.position}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{r.subject ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{r.homeroom ?? <span className="font-normal text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
