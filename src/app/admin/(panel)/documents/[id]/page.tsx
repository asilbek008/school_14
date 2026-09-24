import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import DocumentForm, { type DocumentRow } from "../DocumentForm";
import { deleteDocument } from "../actions";

export const metadata: Metadata = { title: "Hujjatni tahrirlash" };

export default async function EditDocumentPage({ params }: PageProps<"/admin/documents/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/documents" />
      <DocumentForm row={row as DocumentRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteDocument.bind(null, id)} confirmText="Bu hujjatni (fayli bilan) o‘chirasizmi?" />
      </div>
    </>
  );
}
