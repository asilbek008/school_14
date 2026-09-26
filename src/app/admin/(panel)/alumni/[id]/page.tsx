import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import AlumnusForm, { type AlumnusRow } from "../AlumnusForm";
import { deleteAlumnus } from "../actions";

export const metadata: Metadata = { title: "Bitiruvchini tahrirlash" };

export default async function EditAlumnusPage({ params }: PageProps<"/admin/alumni/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("alumni").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  return (
    <>
      <AdminHeader title={row.full_name} back="/admin/alumni" />
      <AlumnusForm row={row as AlumnusRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteAlumnus.bind(null, id)} confirmText="Bu bitiruvchini o‘chirasizmi?" />
      </div>
    </>
  );
}
