import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import OpennessForm, { type OpennessRow } from "../OpennessForm";
import { deleteOpenness } from "../actions";

export const metadata: Metadata = { title: "Ochiqlikni tahrirlash" };

export default async function EditOpennessPage({ params }: PageProps<"/admin/openness/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: documents }] = await Promise.all([
    supabase.from("openness_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("documents").select("id, title_uz").order("title_uz"),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/openness" />
      <OpennessForm row={row as OpennessRow} documents={documents ?? []} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteOpenness.bind(null, id)} confirmText="Bu ma’lumotni o‘chirasizmi?" />
      </div>
    </>
  );
}
