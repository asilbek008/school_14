import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import ClubForm from "../ClubForm";
import { deleteClub } from "../actions";

export const metadata: Metadata = { title: "To‘garakni tahrirlash" };

export default async function EditClubPage({ params }: PageProps<"/admin/clubs/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("clubs").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/clubs" />
      <ClubForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteClub.bind(null, id)} confirmText="Bu to‘garakni o‘chirasizmi?" />
      </div>
    </>
  );
}
