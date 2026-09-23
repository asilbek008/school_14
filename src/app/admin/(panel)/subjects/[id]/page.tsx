import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import SubjectForm from "../SubjectForm";
import { deleteSubject } from "../actions";

export const metadata: Metadata = { title: "Tahrirlash" };

const errors: Record<string, string> = {
  used: "Bu fan dars jadvalida ishlatilgan. Avval uni sinflarning jadvalidan olib tashlang, keyin o‘chiring.",
  failed: "O‘chirib bo‘lmadi. Qaytadan urinib ko‘ring.",
};

export default async function EditSubjectPage({ params, searchParams }: PageProps<"/admin/subjects/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { error } = await searchParams;
  const { data: row } = await supabase.from("subjects").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/subjects" />
      {typeof error === "string" && errors[error] && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {errors[error]}
        </p>
      )}
      <SubjectForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteSubject.bind(null, id)} confirmText="Fanni o‘chirasizmi?" />
      </div>
    </>
  );
}
