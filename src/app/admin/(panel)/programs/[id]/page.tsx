import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import ProgramForm from "../ProgramForm";
import { deleteProgram } from "../actions";

export const metadata: Metadata = { title: "Doimiy tadbirni tahrirlash" };

export default async function EditProgramPage({ params }: PageProps<"/admin/programs/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("programs").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/programs" />
      <ProgramForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteProgram.bind(null, id)} confirmText="Bu doimiy tadbirni o‘chirasizmi?" />
      </div>
    </>
  );
}
