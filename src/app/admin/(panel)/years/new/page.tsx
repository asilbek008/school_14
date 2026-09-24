import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { currentSchoolYear } from "@/lib/school";
import AdminHeader from "@/components/admin/AdminHeader";
import YearForm from "../YearForm";

export const metadata: Metadata = { title: "Yangi o‘quv yili" };

export default async function NewYearPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("school_years").select("start_year");
  const taken = new Set((data ?? []).map((r) => r.start_year));
  // From 2010 to the next year, newest first, without the ones already added.
  const last = currentSchoolYear().from + 1;
  const free = Array.from({ length: last - 2010 + 1 }, (_, i) => last - i).filter((y) => !taken.has(y));
  return (
    <>
      <AdminHeader title="Yangi o‘quv yili" back="/admin/years" />
      {free.length ? <YearForm row={null} free={free} /> : <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Hamma yillar qo‘shilgan.</p>}
    </>
  );
}
