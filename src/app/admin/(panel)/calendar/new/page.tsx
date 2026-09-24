import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import PeriodForm from "../PeriodForm";

export const metadata: Metadata = { title: "Taqvimga qo‘shish" };

export default async function NewPeriodPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Taqvimga qo‘shish" back="/admin/calendar" />
      <PeriodForm />
    </>
  );
}
