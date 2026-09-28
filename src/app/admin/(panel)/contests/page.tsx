import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { fieldLabels, levelLabels } from "../achievements/AchievementForm";

export const metadata: Metadata = { title: "Olimpiada va tanlovlar" };

export default async function AdminContestsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: entries }] = await Promise.all([
    supabase
      .from("contests")
      .select("id, title_uz, field, level, grade_from, grade_to, starts_at, registration_until, is_published")
      .order("sort_order")
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false }),
    supabase.from("contest_entries").select("contest_id, status"),
  ]);
  const rows = data ?? [];
  const count = (id: number) => (entries ?? []).filter((e) => e.contest_id === id).length;
  const fresh = (id: number) => (entries ?? []).filter((e) => e.contest_id === id && e.status === "new").length;

  return (
    <>
      <AdminHeader title="Olimpiada va tanlovlar" action={{ href: "/admin/contests/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytda e’lon qilingan tanlovlar: o‘quvchilar shu yerdan ro‘yxatdan o‘tadi. Ro‘yxat «Ro‘yxat yopiladi» vaqti kelganda o‘zi yopiladi.
        Natijalar chiqqach, ularni{" "}
        <Link href="/admin/achievements" className="font-semibold text-blue-700 hover:underline">
          Yutuqlar
        </Link>{" "}
        bo‘limiga qo‘shing.
      </p>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((r) => {
            const total = count(r.id);
            const fresh_ = fresh(r.id);
            const open = !r.registration_until || new Date(r.registration_until) > new Date();
            return (
              <li key={r.id}>
                <Link href={`/admin/contests/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-slate-50">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] text-slate-900">{r.title_uz}</b>
                    <span className="block text-sm text-slate-500">
                      {fieldLabels[r.field] ?? r.field} · {levelLabels[r.level] ?? r.level}
                      {r.grade_from || r.grade_to ? ` · ${r.grade_from ?? 1}–${r.grade_to ?? 11}-sinf` : ""}
                      {r.starts_at ? ` · ${formatDateTime(r.starts_at, "uz")}` : ""}
                    </span>
                  </span>
                  {total > 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {total} ta ariza{fresh_ ? ` · ${fresh_} yangi` : ""}
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${open ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                    {open ? "Ro‘yxat ochiq" : "Yopilgan"}
                  </span>
                  {!r.is_published && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Yashirin</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali tanlov qo‘shilmagan.</p>
      )}
    </>
  );
}
