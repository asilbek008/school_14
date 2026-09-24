import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { classLabel } from "@/lib/timetable";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import ClassForm from "../ClassForm";
import TimetableEditor from "../TimetableEditor";
import { deleteClass } from "../actions";

export const metadata: Metadata = { title: "Sinf va dars jadvali" };

export default async function EditClassPage({ params, searchParams }: PageProps<"/admin/classes/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { saved } = await searchParams;
  const [{ data: row }, { data: staff }, { data: subjects }, { data: current }] = await Promise.all([
    supabase.from("school_classes").select("id, grade, letter, homeroom_teacher_id, is_published").eq("id", id).maybeSingle(),
    supabase.from("staff").select("id, full_name").order("full_name"),
    supabase.from("subjects").select("id, name_uz").order("sort_order").order("name_uz"),
    supabase.from("lessons").select("weekday, period, subject_id, teacher, alt_subject_id, alt_teacher").eq("class_id", id),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={`${classLabel(row)} sinf`} back="/admin/classes" />

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Haftalik dars jadvali</h2>
          <Link href={`/uz/timetable/${id}`} className="text-sm text-blue-700 hover:underline">
            Saytda ko‘rish ↗
          </Link>
        </div>
        {saved && <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">Jadval saqlandi.</p>}
        {subjects?.length ? (
          <TimetableEditor classId={id} grade={row.grade} subjects={subjects} current={current ?? []} />
        ) : (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
            Avval <Link href="/admin/subjects" className="text-blue-700 hover:underline">Fanlar</Link> bo‘limida fanlarni qo‘shing.
          </p>
        )}
      </section>

      <h2 className="mb-3 text-lg font-bold">Sinf ma’lumotlari</h2>
      <ClassForm row={row} staff={staff ?? []} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteClass.bind(null, id)} confirmText="Sinf va uning dars jadvali o‘chirilsinmi?" />
      </div>
    </>
  );
}
