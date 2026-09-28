import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import ContestForm from "../ContestForm";

export const metadata: Metadata = { title: "Tanlov qo‘shish" };

export default async function NewContestPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Tanlov qo‘shish" back="/admin/contests" />
      <ContestForm />
    </>
  );
}
