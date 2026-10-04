import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import VideoForm, { type VideoRow } from "../VideoForm";
import { deleteVideo } from "../actions";

export const metadata: Metadata = { title: "Videoni tahrirlash" };

export default async function EditVideoPage({ params }: PageProps<"/admin/videos/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/videos" />
      <VideoForm row={row as VideoRow} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteVideo.bind(null, id)} confirmText="Bu videoni o‘chirasizmi?" />
      </div>
    </>
  );
}
