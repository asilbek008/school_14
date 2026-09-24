import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Fanlar" };

export default async function AdminSubjectsPage() {
  const { supabase } = await requireAdmin();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name_uz, name_ru, name_en, sort_order, lessons!lessons_subject_id_fkey(count)")
    .order("sort_order")
    .order("name_uz");

  return (
    <>
      <AdminHeader title="Fanlar" action={{ href: "/admin/subjects/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 text-sm text-slate-600">
        Dars jadvalini to‘ldirishda shu ro‘yxatdan fan tanlanadi. Fan nomini bu yerda o‘zgartirsangiz, barcha
        sinflarning jadvalida ham o‘zgaradi.
      </p>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {subjects?.length ? (
          <ul className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/subjects/${s.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name_uz}</p>
                    <p className="truncate text-sm text-slate-500">
                      {[s.name_ru, s.name_en].filter(Boolean).join(" · ") || "Tarjima yo‘q"} · #{s.sort_order}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{s.lessons[0]?.count ?? 0} ta dars</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali fan qo‘shilmagan.</p>
        )}
      </div>
    </>
  );
}
