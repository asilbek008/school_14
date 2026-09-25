import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import QuestionForm, { type QuestionRow } from "../../../QuestionForm";
import { deleteQuestion } from "../../../actions";

export const metadata: Metadata = { title: "Savolni tahrirlash" };

export default async function EditQuestionPage({ params }: PageProps<"/admin/tests/[id]/questions/[qid]">) {
  const { supabase } = await requireAdmin();
  const p = await params;
  const id = Number(p.id);
  const qid = Number(p.qid);
  const [{ data: test }, { data: row }] = await Promise.all([
    supabase.from("tests").select("title_uz").eq("id", id).maybeSingle(),
    supabase.from("test_questions").select("id, question, options, correct, explanation, image").eq("id", qid).eq("test_id", id).maybeSingle(),
  ]);
  if (!test || !row) notFound();

  return (
    <>
      <AdminHeader title="Savolni tahrirlash" back={`/admin/tests/${id}#questions`} />
      <p className="mb-4 text-sm text-slate-600">{test.title_uz}</p>
      <QuestionForm testId={id} row={row as QuestionRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteQuestion.bind(null, id, qid)} confirmText="Bu savolni o‘chirasizmi?" />
      </div>
    </>
  );
}
