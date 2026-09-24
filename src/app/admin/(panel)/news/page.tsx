import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import NewsList, { type NewsItem } from "./NewsList";

export const metadata: Metadata = { title: "Yangiliklar" };

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Every news item for the list, read at request time (the admin panel is never cached). */
async function load(supabase: Supabase): Promise<NewsItem[]> {
  const now = Date.now();
  const { data: news } = await supabase
    .from("news")
    .select("id, slug, title_uz, category, cover_image, is_published, published_at, news_photos(count), news_videos(count), telegram_posts(post_id)")
    .order("created_at", { ascending: false });

  return (news ?? []).map((n) => ({
    id: n.id,
    title: n.title_uz,
    slug: n.slug,
    category: n.category,
    cover: n.cover_image ? `${mediaBaseUrl}/${n.cover_image}` : null,
    date: n.published_at ? formatDate(n.published_at, "uz") : null,
    photos: n.news_photos[0]?.count ?? 0,
    videos: n.news_videos[0]?.count ?? 0,
    telegram: n.telegram_posts.length > 0,
    published: n.is_published,
    // Published but dated ahead: the site shows it from that moment.
    scheduled: n.is_published && !!n.published_at && Date.parse(n.published_at) > now ? formatDateTime(n.published_at, "uz") : null,
  }));
}

export default async function AdminNewsPage() {
  const { supabase } = await requireAdmin();
  const items = await load(supabase);

  return (
    <>
      <AdminHeader title="Yangiliklar" action={{ href: "/admin/news/new", label: "+ Yangi yangilik" }} />
      {items.length ? (
        <NewsList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali yangilik yo‘q.</p>
      )}
    </>
  );
}
