import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import VideoForm from "../VideoForm";

export const metadata: Metadata = { title: "Video qo‘shish" };

export default async function NewVideoPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Video qo‘shish" back="/admin/videos" />
      <VideoForm />
    </>
  );
}
