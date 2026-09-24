"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type StaffRow = {
  id: number;
  name: string;
  position: string;
  positionKey: string; // positionKey() of the Uzbek name, what the filter matches
  subject: string | null;
  homeroom: string | null;
  photo: string | null;
};

type Labels = {
  search: string;
  allPositions: string;
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
export default function StaffDirectory({
  rows,
  positions,
  lang,
  t,
}: {
  rows: StaffRow[];
  positions: { value: string; label: string }[];
  lang: string;
  t: Labels;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!position || r.positionKey === position) &&
      (!q || r.name.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q)),
  );
  const href = (r: StaffRow) => `/${lang}/staff/${r.id}`;
  const field = "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2.5 sm:flex-row">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className={`${field} flex-1`} />
        <select value={position} onChange={(e) => setPosition(e.target.value)} aria-label={t.colPosition} className={`${field} sm:w-72`}>
          <option value="">{t.allPositions}</option>
          {positions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
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
