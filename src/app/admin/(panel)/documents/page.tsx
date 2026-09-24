import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import SortableList, { type SortableItem } from "@/components/admin/SortableList";
import { categoryLabels } from "./DocumentForm";
import { reorderDocuments } from "./actions";

export const metadata: Metadata = { title: "Hujjatlar" };

const mb = (bytes: number | null) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : null);

export default async function AdminDocumentsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("documents")
    .select("id, title_uz, title_ru, title_en, category, kind, path, url, file_type, file_size, doc_date, is_published")
    .order("sort_order")
    .order("id");

  const items: SortableItem[] = (data ?? []).map((d) => ({
    id: d.id,
    name: d.title_uz,
    href: `/admin/documents/${d.id}`,
    cover: null,
    meta: [
      categoryLabels[d.category] ?? d.category,
      d.kind === "link" ? "🔗 Havola" : `📄 ${(d.file_type ?? "fayl").toUpperCase()}${mb(d.file_size) ? ` · ${mb(d.file_size)}` : ""}`,
      d.doc_date ? formatDate(d.doc_date, "uz") : "",
    ].filter(Boolean),
    warning: !d.title_ru || !d.title_en ? "Tarjimasi to‘liq emas" : null,
    published: d.is_published,
  }));

  return (
    <>
      <AdminHeader title="Hujjatlar" action={{ href: "/admin/documents/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Hujjatlar» bo‘limi: litsenziya, nizom, buyruq, hisobot va ota-onalar to‘ldiradigan ariza shakllari.
        Tartibni sudrab o‘zgartirasiz — saytda ham shu tartibda chiqadi.
      </p>
      {items.length ? (
        <SortableList items={items} reorder={reorderDocuments} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali hujjat qo‘shilmagan.</p>
      )}
    </>
  );
}
