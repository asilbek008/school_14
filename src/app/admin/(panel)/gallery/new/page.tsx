import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import AlbumForm from "../AlbumForm";

export const metadata: Metadata = { title: "Yangi albom" };

export default async function NewAlbumPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Yangi albom" back="/admin/gallery" />
      <AlbumForm />
    </>
  );
}
