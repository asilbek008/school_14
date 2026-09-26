import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { subjectLabels } from "../../TestForm";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminForm from "@/components/admin/AdminForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { FormSection, TranslatedField } from "@/components/admin/fields";
import { deleteNote, saveNote } from "../actions";

export const metadata: Metadata = { title: "Qisqa dars" };

export default async function EditNotePage({ searchParams }: PageProps<"/admin/tests/notes/edit">) {
  const { supabase } = await requireAdmin();
  const q = await searchParams;
  const subject = String(q.s ?? "");
  const topic = String(q.t ?? "");
  if (!subject || !topic) notFound();
  const { data: row } = await supabase
    .from("study_notes")
    .select("body_uz, body_ru, body_en, is_published")
    .eq("subject", subject)
    .eq("topic", topic)
    .maybeSingle();

  return (
    <>
      <AdminHeader title={`${subjectLabels[subject] ?? subject}: ${topic}`} back={`/admin/tests/notes?s=${encodeURIComponent(subject)}`} />
      <AdminForm action={saveNote}>
        <input type="hidden" name="subject" value={subject} />
        <input type="hidden" name="topic" value={topic} />
        <FormSection title="Qisqa dars">
          <p className="text-sm text-slate-600">
            Oddiy matn: bo‘sh qator — yangi paragraf. Tavsiya: 1) qoida yoki ta’rif, 2) bitta yechilgan misol, 3) «Diqqat:» — ko‘p
            uchraydigan xato.
          </p>
          <TranslatedField name="body" label="Matn" row={row ?? {}} multiline />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_published" defaultChecked={row?.is_published ?? true} className="size-4" />
            Saytda ko‘rsatish
          </label>
        </FormSection>
      </AdminForm>
      {row && (
        <div className="mt-8 border-t border-slate-200 pt-4 text-right">
          <DeleteButton action={deleteNote.bind(null, subject, topic)} confirmText="Bu dars o‘chirilsinmi?" />
        </div>
      )}
    </>
  );
}
