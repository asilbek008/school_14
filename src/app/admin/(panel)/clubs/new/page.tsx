import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import ClubForm from "../ClubForm";

export const metadata: Metadata = { title: "To‘garak qo‘shish" };

export default async function NewClubPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="To‘garak qo‘shish" back="/admin/clubs" />
      <ClubForm />
    </>
  );
}
