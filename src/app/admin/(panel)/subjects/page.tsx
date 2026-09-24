import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import SortableList, { type SortableItem } from "@/components/admin/SortableList";
import { reorderSubjects } from "./actions";

export const metadata: Metadata = { title: "Fanlar" };

export default async function AdminSubjectsPage() {
  const { supabase } = await requireAdmin();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name_uz, name_ru, name_en, main:lessons!lessons_subject_id_fkey(count), alt:lessons!lessons_alt_subject_id_fkey(count)")
    .order("sort_order")
    .order("name_uz");

  const items: SortableItem[] = (subjects ?? []).map((s) => {
    const lessons = s.main[0]?.count ?? 0;
    const alt = s.alt[0]?.count ?? 0;
    const missing = [!s.name_ru && "ruscha", !s.name_en && "inglizcha"].filter(Boolean);
    return {
      id: s.id,
      name: s.name_uz,
      href: `/admin/subjects/${s.id}`,
      cover: null,
      meta: [
        [s.name_ru, s.name_en].filter(Boolean).join(" · "),
        lessons || alt ? `📅 ${lessons} ta dars${alt ? ` (+${alt} almashib)` : ""}` : "Jadvalda ishlatilmagan",
      ].filter(Boolean),
      warning: missing.length ? `${missing.join(" va ")} nomi yo‘q` : null,
    };
  });

  return (
    <>
      <AdminHeader title="Fanlar" action={{ href: "/admin/subjects/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 text-sm text-slate-600">
        Dars jadvalini to‘ldirishda shu ro‘yxatdan fan tanlanadi — jadval tahririda fanlar shu tartibda chiqadi. Fan nomini bu
        yerda o‘zgartirsangiz, barcha sinflarning jadvalida ham o‘zgaradi.
      </p>
      {items.length ? (
        <SortableList items={items} reorder={reorderSubjects} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali fan qo‘shilmagan.</p>
      )}
    </>
  );
}
