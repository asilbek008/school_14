import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import { mediaBaseUrl } from "@/lib/media";
import NewsForm from "../NewsForm";
import { addNewsPhotos, deleteNews, deleteNewsPhoto } from "../actions";

export const metadata: Metadata = { title: "Yangilikni tahrirlash" };

export default async function EditNewsPage({ params }: PageProps<"/admin/news/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: row } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const { data: photos } = await supabase
    .from("news_photos")
    .select("id, path")
    .eq("news_id", id)
    .order("sort_order")
    .order("id");

  return (
    <>
      <AdminHeader title="Yangilikni tahrirlash" back="/admin/news" />
      <NewsForm row={row} />

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-bold">Rasmlar galereyasi ({photos?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-slate-500">
          Muqovadan tashqari qo‘shimcha rasmlar — yangilik sahifasining pastida galereya bo‘lib chiqadi.
        </p>
        <PhotoUploader folder={`news/${id}`} onUploaded={addNewsPhotos.bind(null, id)} />
        {photos && photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={`${mediaBaseUrl}/${photo.path}`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex justify-end px-3 py-2 text-sm">
                  <DeleteButton action={deleteNewsPhoto.bind(null, id, photo.id)} confirmText="Bu rasmni o‘chirasizmi?" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="mt-4 text-right">
        <DeleteButton action={deleteNews.bind(null, id)} confirmText="Bu yangilikni o‘chirasizmi?" />
      </div>
    </>
  );
}
