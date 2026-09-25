import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import BookForm from "../BookForm";

export const metadata: Metadata = { title: "Kitob qo‘shish" };

export default async function NewBookPage() {
  const { supabase } = await requireAdmin();
  const { data: subjects } = await supabase.from("subjects").select("id, name_uz").order("sort_order").order("name_uz");
  return (
    <>
      <AdminHeader title="Kitob qo‘shish" back="/admin/library" />
      <BookForm subjects={subjects ?? []} />
    </>
  );
}
