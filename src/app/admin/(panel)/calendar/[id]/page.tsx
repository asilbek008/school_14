import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PeriodForm, { type PeriodRow } from "../PeriodForm";
import { deletePeriod } from "../actions";

export const metadata: Metadata = { title: "Taqvimni tahrirlash" };

export default async function EditPeriodPage({ params }: PageProps<"/admin/calendar/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("calendar_periods").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/calendar" />
      <PeriodForm row={row as PeriodRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deletePeriod.bind(null, id)} confirmText="Bu davrni taqvimdan o‘chirasizmi?" />
      </div>
    </>
  );
}
