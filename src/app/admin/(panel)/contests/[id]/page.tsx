import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import ContestForm, { type ContestRow } from "../ContestForm";
import EntryList, { type EntryItem } from "../EntryList";
import { deleteContest } from "../actions";

export const metadata: Metadata = { title: "Tanlovni tahrirlash" };

/** The contest itself, and under it the pupils who signed up for it. */
export default async function EditContestPage({ params }: PageProps<"/admin/contests/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: entries }] = await Promise.all([
    supabase.from("contests").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("contest_entries")
      .select("id, code, pupil_name, grade, class_letter, parent_phone, teacher, note, status, created_at")
      .eq("contest_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!row) notFound();

  const items: EntryItem[] = (entries ?? []).map((e) => ({
    id: e.id,
    code: e.code,
    name: e.pupil_name,
    grade: e.grade,
    letter: e.class_letter,
    phone: e.parent_phone,
    teacher: e.teacher,
    note: e.note,
    status: e.status,
    date: formatDateTime(e.created_at, "uz"),
  }));

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/contests" />
      <ContestForm row={row as ContestRow} />

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Ro‘yxatdan o‘tganlar · {items.length}</h2>
        <p className="mb-4 max-w-3xl text-sm text-slate-600">
          O‘quvchining ismi va ota-onasining telefoni — shaxsiy ma’lumot: saytda ko‘rinmaydi, faqat shu yerda. Saytdagi sahifada
          faqat ishtirokchilar soni chiqadi.
        </p>
        <EntryList items={items} />
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteContest.bind(null, id)} confirmText="Bu tanlov va unga kelgan barcha arizalar o‘chirilsinmi?" />
      </div>
    </>
  );
}
