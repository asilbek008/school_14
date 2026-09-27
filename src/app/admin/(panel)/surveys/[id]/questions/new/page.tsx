import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import QuestionForm from "../../../QuestionForm";

export const metadata: Metadata = { title: "Yangi savol" };

export default async function NewQuestionPage({ params }: PageProps<"/admin/surveys/[id]/questions/new">) {
  await requireAdmin();
  const id = Number((await params).id);
  return (
    <>
      <AdminHeader title="Yangi savol" back={`/admin/surveys/${id}`} />
      <QuestionForm surveyId={id} />
    </>
  );
}
