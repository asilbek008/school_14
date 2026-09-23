import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import EventForm from "../EventForm";
import { deleteEvent } from "../actions";

export const metadata: Metadata = { title: "Tadbirni tahrirlash" };

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title="Tadbirni tahrirlash" back="/admin/events" />
      <EventForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteEvent.bind(null, id)} confirmText="Bu tadbirni o‘chirasizmi?" />
      </div>
    </>
  );
}
