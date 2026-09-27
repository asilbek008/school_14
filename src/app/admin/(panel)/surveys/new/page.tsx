import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import SurveyForm from "../SurveyForm";

export const metadata: Metadata = { title: "Yangi so‘rovnoma" };

export default async function NewSurveyPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Yangi so‘rovnoma" back="/admin/surveys" />
      <SurveyForm />
    </>
  );
}
