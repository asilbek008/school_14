import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DocumentForm from "../DocumentForm";

export const metadata: Metadata = { title: "Hujjat qo‘shish" };

export default async function NewDocumentPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Hujjat qo‘shish" back="/admin/documents" />
      <DocumentForm />
    </>
  );
}
