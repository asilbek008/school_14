import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import NewsForm from "../NewsForm";

export const metadata: Metadata = { title: "Yangi yangilik" };

export default async function NewNewsPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Yangi yangilik" back="/admin/news" />
      <NewsForm />
      <p className="mt-4 text-sm text-slate-500">Saqlagandan keyin shu yangilikka rasmlar galereyasini qo‘shishingiz mumkin.</p>
    </>
  );
}
