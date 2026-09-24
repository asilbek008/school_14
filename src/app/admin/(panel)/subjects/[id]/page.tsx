import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { classLabel } from "@/lib/timetable";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import SubjectForm from "../SubjectForm";
import { deleteSubject } from "../actions";

export const metadata: Metadata = { title: "Tahrirlash" };

const errors: Record<string, string> = {
  used: "Bu fan dars jadvalida ishlatilgan. Avval uni sinflarning jadvalidan olib tashlang, keyin o‘chiring.",
  failed: "O‘chirib bo‘lmadi. Qaytadan urinib ko‘ring.",
};

type Use = {
  subject_id: number;
  teacher: string | null;
  alt_teacher: string | null;
  school_classes: { id: number; grade: number; letter: string } | null;
};

export default async function EditSubjectPage({ params, searchParams }: PageProps<"/admin/subjects/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { error } = await searchParams;
  const [{ data: row }, { data }] = await Promise.all([
    supabase.from("subjects").select("id, name_uz, name_ru, name_en").eq("id", id).maybeSingle(),
    supabase
      .from("lessons")
      .select("subject_id, teacher, alt_teacher, school_classes(id, grade, letter)")
      .or(`subject_id.eq.${id},alt_subject_id.eq.${id}`),
  ]);
  if (!row) notFound();
  // Untyped client: the to-one embed comes typed as a list.
  const uses = (data ?? []) as unknown as Use[];

  // Classes (with their lesson count) and teachers that use this subject.
  const classes = new Map<number, { label: string; grade: number; n: number }>();
  const teachers = new Set<string>();
  for (const u of uses) {
    const c = u.school_classes;
    if (c) classes.set(c.id, { label: classLabel(c), grade: c.grade, n: (classes.get(c.id)?.n ?? 0) + 1 });
    const t = u.subject_id === id ? u.teacher : u.alt_teacher;
    if (t) teachers.add(t);
  }
  const classList = [...classes.entries()].sort((a, b) => a[1].grade - b[1].grade || a[1].label.localeCompare(b[1].label));

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/subjects" />
      {typeof error === "string" && errors[error] && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {errors[error]}
        </p>
      )}
      <div className="mb-6 rounded-xl bg-white p-5 text-sm shadow-sm">
        {uses.length ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold text-slate-600">Jadvalda</dt>
            <dd className="text-slate-900">
              {uses.length} ta dars, {classList.length} ta sinfda
            </dd>
            <dt className="font-semibold text-slate-600">Sinflar</dt>
            <dd className="flex flex-wrap gap-1.5">
              {classList.map(([classId, c]) => (
                <Link
                  key={classId}
                  href={`/admin/classes/${classId}`}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 hover:bg-blue-100 hover:text-blue-800"
                  title={`${c.n} ta dars`}
                >
                  {c.label} · {c.n}
                </Link>
              ))}
            </dd>
            {teachers.size > 0 && (
              <>
                <dt className="font-semibold text-slate-600">O‘qituvchilar</dt>
                <dd className="text-slate-900">{[...teachers].sort((a, b) => a.localeCompare(b)).join(", ")}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="text-slate-600">Bu fan hali hech bir sinfning jadvalida ishlatilmagan.</p>
        )}
      </div>
      <SubjectForm row={row} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        {uses.length ? (
          <p className="text-sm text-slate-500">O‘chirish uchun avval fanni yuqoridagi sinflarning jadvalidan olib tashlang.</p>
        ) : (
          <DeleteButton action={deleteSubject.bind(null, id)} confirmText="Fanni o‘chirasizmi?" />
        )}
      </div>
    </>
  );
}
