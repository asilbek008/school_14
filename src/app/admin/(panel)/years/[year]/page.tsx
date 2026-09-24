import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { yearLabel, type SchoolYearRow } from "@/lib/school-years";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import YearForm from "../YearForm";
import { deleteYear } from "../actions";

export const metadata: Metadata = { title: "O‘quv yili" };

export default async function EditYearPage({ params }: PageProps<"/admin/years/[year]">) {
  const { supabase } = await requireAdmin();
  const start = Number((await params).year);
  const { data } = await supabase.from("school_years").select("*").eq("start_year", start).maybeSingle();
  if (!data) notFound();
  const row = data as SchoolYearRow;
  return (
    <>
      <AdminHeader title={`${yearLabel(start)} o‘quv yili`} back="/admin/years" />
      <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-slate-600">Saytda ko‘rish:</span>
        {(["uz", "ru", "en"] as const).map((lang) => (
          <a key={lang} href={`/${lang}/year/${start}`} target="_blank" className="text-blue-700 hover:underline">
            {lang.toUpperCase()} ↗
          </a>
        ))}
      </p>
      <YearForm row={row} />
      <div className="mt-6">
        <DeleteButton
          action={deleteYear.bind(null, start)}
          confirmText={`${yearLabel(start)} o‘quv yili ro‘yxatdan o‘chirilsinmi? Yangilik va tadbirlar o‘chmaydi.`}
        />
      </div>
    </>
  );
}
