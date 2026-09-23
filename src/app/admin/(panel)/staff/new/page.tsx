import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import StaffForm from "../StaffForm";

export const metadata: Metadata = { title: "O‘qituvchi qo‘shish" };

export default async function NewStaffPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="O‘qituvchi qo‘shish" back="/admin/staff" />
      <StaffForm />
    </>
  );
}
