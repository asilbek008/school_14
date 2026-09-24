import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import ProgramForm from "../ProgramForm";

export const metadata: Metadata = { title: "Doimiy tadbir qo‘shish" };

export default async function NewProgramPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Doimiy tadbir qo‘shish" back="/admin/programs" />
      <ProgramForm />
    </>
  );
}
