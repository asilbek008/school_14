"use client";

import { useState } from "react";
import Link from "next/link";
import Status from "@/components/admin/Status";
import { inputClass } from "@/components/admin/fields";
import { avatarGradient, groupBadge, initials, type StaffGroup } from "@/lib/positions";

export type StaffItem = {
  id: number;
  name: string;
  shortName: string | null;
  position: string;
  group: StaffGroup;
  subject: string | null;
  photo: string | null;
  homeroom: string[];
  /** Timetable lessons found under the eMaktab name. */
  lessons: number;
  contact: boolean;
  order: number;
  published: boolean;
};

const groups: { key: StaffGroup; label: string }[] = [
  { key: "leaders", label: "Rahbariyat" },
  { key: "teachers", label: "O‘qituvchilar" },
  { key: "others", label: "Xodimlar" },
];

// Gaps worth filling; each is a filter.
const gaps = {
  photo: { label: "Rasmsiz", test: (s: StaffItem) => !s.photo },
  short: { label: "eMaktab nomisiz", test: (s: StaffItem) => s.group === "teachers" && !s.shortName },
  lessons: { label: "Jadvalda darsi topilmagan", test: (s: StaffItem) => s.group === "teachers" && !!s.shortName && s.lessons === 0 },
  hidden: { label: "Yashirin", test: (s: StaffItem) => !s.published },
};
type Gap = keyof typeof gaps;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
  }`;

/** Everyone on the staff list with search, group filters and filters for missing data. */
export default function StaffList({ items }: { items: StaffItem[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<StaffGroup | null>(null);
  const [gap, setGap] = useState<Gap | "">("");

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (s) =>
      (!group || s.group === group) &&
      (!gap || gaps[gap].test(s)) &&
      (!q || [s.name, s.shortName, s.subject, s.position].some((v) => v?.toLowerCase().includes(q))),
  );

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism, eMaktab nomi yoki fan bo‘yicha qidirish…"
          aria-label="Qidirish"
          className={`${inputClass} mt-0`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setGroup(null)} className={chip(group === null)}>
            Hammasi · {items.length}
          </button>
          {groups.map((g) => (
            <button key={g.key} type="button" onClick={() => setGroup(g.key)} className={chip(group === g.key)}>
              {g.label} · {items.filter((s) => s.group === g.key).length}
            </button>
          ))}
          <select
            value={gap}
            onChange={(e) => setGap(e.target.value as Gap | "")}
            aria-label="Kamchiliklar"
            className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Barcha ma’lumotlar</option>
            {(Object.keys(gaps) as Gap[]).map((k) => (
              <option key={k} value={k}>
                {gaps[k].label} · {items.filter(gaps[k].test).length}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-2 text-sm text-slate-500">{shown.length} ta xodim</p>
      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/staff/${s.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 sm:gap-4"
              >
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img src={s.photo} alt="" loading="lazy" className="size-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${avatarGradient(s.id)}`}>
                    {initials(s.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">
                    {s.name}
                    {s.shortName && <span className="font-normal text-slate-400"> · {s.shortName}</span>}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${groupBadge[s.group]}`}>{s.position}</span>
                    {s.subject && <span>{s.subject}</span>}
                    {s.homeroom.length > 0 && <span>🏫 {s.homeroom.join(", ")} sinf rahbari</span>}
                    {s.lessons > 0 && <span>📅 {s.lessons} ta dars</span>}
                    {s.contact && <span title="Telefon yoki email saytda ko‘rinadi">📞</span>}
                    {gaps.short.test(s) && <span className="text-amber-700">eMaktab nomi yo‘q</span>}
                    {gaps.lessons.test(s) && <span className="text-amber-700">jadvalda darsi topilmadi</span>}
                  </p>
                </div>
                <Status published={s.published} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hech kim topilmadi.</p>
      )}
    </div>
  );
}
