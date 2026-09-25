import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import BookForm, { type BookRow } from "../BookForm";
import { deleteBook } from "../actions";

export const metadata: Metadata = { title: "Kitobni tahrirlash" };

export default async function EditBookPage({ params }: PageProps<"/admin/library/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: subjects }] = await Promise.all([
    supabase.from("textbooks").select("*").eq("id", id).maybeSingle(),
    supabase.from("subjects").select("id, name_uz").order("sort_order").order("name_uz"),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/library" />
      {row.is_published && (
        <p className="mb-4 text-sm">
          <a href={`/uz/library/${id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
            Saytda ochish ↗
          </a>
        </p>
      )}
      <BookForm row={row as BookRow} subjects={subjects ?? []} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteBook.bind(null, id)} confirmText="Bu kitob (va uning PDF fayli) o‘chirilsinmi?" />
      </div>
    </>
  );
}
