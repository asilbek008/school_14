import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import QuestionForm from "../../../QuestionForm";

export const metadata: Metadata = { title: "Savol qo‘shish" };

export default async function NewQuestionPage({ params, searchParams }: PageProps<"/admin/tests/[id]/questions/new">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: test }, { count }] = await Promise.all([
    supabase.from("tests").select("title_uz").eq("id", id).maybeSingle(),
    supabase.from("test_questions").select("id", { count: "exact", head: true }).eq("test_id", id),
  ]);
  if (!test) notFound();
  const saved = (await searchParams).saved;

  return (
    <>
      <AdminHeader title={`${(count ?? 0) + 1}-savol`} back={`/admin/tests/${id}#questions`} />
      <p className="mb-4 text-sm text-slate-600">{test.title_uz}</p>
      {saved && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-900">✓ Oldingi savol saqlandi.</p>}
      <QuestionForm key={count ?? 0} testId={id} />
    </>
  );
}
