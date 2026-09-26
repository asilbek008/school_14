import { requireAdmin } from "@/lib/admin";

/** Downloads one backup as a JSON file (to keep a copy off the site: a flash drive, Google Drive). */
export async function GET(_request: Request, { params }: RouteContext<"/admin/backups/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) return new Response("Topilmadi", { status: 404 });
  const { data, error } = await supabase.from("backups").select("taken_at, data").eq("id", id).maybeSingle();
  if (error || !data) return new Response("Topilmadi", { status: 404 });
  const day = new Date(Date.parse(data.taken_at) + 5 * 3_600_000).toISOString().slice(0, 10);
  const body = JSON.stringify({ site: "14-maktab", taken_at: data.taken_at, tables: data.data });
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="maktab14-zaxira-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
