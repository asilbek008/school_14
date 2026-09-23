import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "Tadbirlar" };

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { data: events } = await supabase
    .from("events")
    .select("id, title_uz, location, starts_at, is_published")
    .order("starts_at", { ascending: false });

  return (
    <>
      <AdminHeader title="Tadbirlar" action={{ href: "/admin/events/new", label: "+ Yangi tadbir" }} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {events?.length ? (
          <ul className="divide-y divide-slate-100">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/admin/events/${event.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{event.title_uz}</p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(event.starts_at, "uz")}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <Status published={event.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali tadbir yo‘q.</p>
        )}
      </div>
    </>
  );
}
