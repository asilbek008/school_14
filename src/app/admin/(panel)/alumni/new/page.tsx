import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AlumnusForm from "../AlumnusForm";

export const metadata: Metadata = { title: "Bitiruvchi qo‘shish" };

export default async function NewAlumnusPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Bitiruvchi qo‘shish" back="/admin/alumni" />
      <AlumnusForm />
    </>
  );
}
