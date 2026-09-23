import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminForm from "@/components/admin/AdminForm";
import { TranslatedField } from "@/components/admin/fields";
import { savePage } from "../actions";

export const metadata: Metadata = { title: "Sahifani tahrirlash" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  const { supabase } = await requireAdmin();
  const { slug } = await params;
  const { data: row } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/pages" />
      <AdminForm action={savePage.bind(null, slug)}>
        <TranslatedField name="title" label="Sarlavha" row={row} />
        <TranslatedField name="body" label="Matn" row={row} multiline uzRequired={false} />
      </AdminForm>
    </>
  );
}
