import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import SubjectForm from "../SubjectForm";

export const metadata: Metadata = { title: "Fan qo‘shish" };

export default async function NewSubjectPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Fan qo‘shish" back="/admin/subjects" />
      <SubjectForm />
    </>
  );
}
