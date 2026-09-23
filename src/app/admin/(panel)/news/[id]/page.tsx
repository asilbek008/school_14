import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import NewsForm from "../NewsForm";
import { deleteNews } from "../actions";

export const metadata: Metadata = { title: "Yangilikni tahrirlash" };

export default async function EditNewsPage({ params }: PageProps<"/admin/news/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title="Yangilikni tahrirlash" back="/admin/news" />
      <NewsForm row={row} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteNews.bind(null, id)} confirmText="Bu yangilikni o‘chirasizmi?" />
      </div>
    </>
  );
}
