import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import TestForm from "../TestForm";

export const metadata: Metadata = { title: "Test qo‘shish" };

export default async function NewTestPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Test qo‘shish" back="/admin/tests" />
      <TestForm />
    </>
  );
}
