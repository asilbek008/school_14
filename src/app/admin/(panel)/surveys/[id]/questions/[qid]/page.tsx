import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import QuestionForm, { type QuestionRow } from "../../../QuestionForm";
import { deleteQuestion } from "../../../actions";

export const metadata: Metadata = { title: "Savolni tahrirlash" };

export default async function EditQuestionPage({ params }: PageProps<"/admin/surveys/[id]/questions/[qid]">) {
  const { supabase } = await requireAdmin();
  const { id, qid } = await params;
  const surveyId = Number(id);
  const { data: row } = await supabase.from("survey_questions").select("*").eq("id", Number(qid)).maybeSingle();
  if (!row || row.survey_id !== surveyId) notFound();

  return (
    <>
      <AdminHeader title="Savolni tahrirlash" back={`/admin/surveys/${surveyId}`} />
      <QuestionForm surveyId={surveyId} row={row as QuestionRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteQuestion.bind(null, surveyId, Number(qid))} confirmText="Bu savolni o‘chirasizmi?" />
      </div>
    </>
  );
}
