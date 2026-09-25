import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import SortableList, { type SortableItem } from "@/components/admin/SortableList";
import { reorderBooks } from "./actions";

export const metadata: Metadata = { title: "Kutubxona" };

const mb = (bytes: number | null) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : null);

export default async function AdminLibraryPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("textbooks")
    .select("id, title_uz, title_ru, title_en, grade, language, kind, file_size, pages, cover, is_published, subjects(name_uz)")
    .order("grade", { nullsFirst: false })
    .order("sort_order")
    .order("id");
  const rows = data ?? [];
  const groups = [...new Set(rows.map((r) => r.grade))];
  const item = (r: (typeof rows)[number]): SortableItem => {
    // Untyped client: the to-one embed comes typed as a list.
    const subject = (r.subjects as unknown as { name_uz: string } | null)?.name_uz;
    return {
      id: r.id,
      name: r.title_uz,
      href: `/admin/library/${r.id}`,
      cover: r.cover ? `${mediaBaseUrl}/${r.cover}` : null,
      meta: [
        subject ?? "Fan tanlanmagan",
        r.kind === "link" ? "🔗 Havola" : [r.pages && `${r.pages} sahifa`, mb(r.file_size)].filter(Boolean).join(" · ") || "📄 PDF",
        r.language !== "uz" ? (r.language === "ru" ? "Ruscha" : "Inglizcha") : "",
      ].filter(Boolean),
      warning: !r.cover && r.kind === "file" ? "Muqovasi yo‘q" : null,
      published: r.is_published,
    };
  };

  return (
    <>
      <AdminHeader title="Elektron kutubxona" action={{ href: "/admin/library/new", label: "+ Kitob qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Darsliklar va o‘quv kitoblari (PDF). O‘quvchilar ularni saytning o‘zida o‘qiydi yoki yuklab oladi. Faqat tarqatishga ruxsat
        berilgan kitoblarni joylang. Har sinf ichida tartibni sudrab o‘zgartirasiz.
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Kitoblar", rows.length],
          ["Saytda", rows.filter((r) => r.is_published).length],
          ["Sahifalar", rows.reduce((a, r) => a + (r.pages ?? 0), 0)],
          ["Hajmi", `${(rows.reduce((a, r) => a + (r.file_size ?? 0), 0) / (1024 * 1024)).toFixed(0)} MB`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <b className="block text-2xl">{value}</b>
            <span className="text-sm text-slate-500">{label}</span>
          </div>
        ))}
      </div>
      {rows.length ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g ?? "general"}>
              <h2 className="mb-2 text-sm font-bold text-slate-600">{g ? `${g}-sinf` : "Umumiy"}</h2>
              <SortableList items={rows.filter((r) => r.grade === g).map(item)} reorder={reorderBooks} />
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali kitob qo‘shilmagan.</p>
      )}
    </>
  );
}
