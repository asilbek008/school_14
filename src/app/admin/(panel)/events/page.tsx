import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateFull } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import EventList, { type EventItem } from "./EventList";

export const metadata: Metadata = { title: "Tadbirlar" };

const tz = "Asia/Tashkent";
const day = new Intl.DateTimeFormat("en", { day: "numeric", timeZone: tz });
const month = new Intl.DateTimeFormat("uz-UZ", { month: "short", timeZone: tz });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });

type Row = {
  id: number;
  title_uz: string;
  location: string | null;
  category: EventItem["category"];
  all_day: boolean;
  starts_at: string;
  ends_at: string | null;
  is_published: boolean;
  telegram_posts: unknown[];
};

/** Display values for the list; "upcoming" is decided at request time (this page is not cached). */
function toItems(events: Row[]): EventItem[] {
  const now = Date.now();
  return events.map((e) => {
    const start = new Date(e.starts_at);
    const end = e.ends_at ? new Date(e.ends_at) : null;
    return {
      id: e.id,
      title: e.title_uz,
      category: e.category,
      day: day.format(start),
      month: month.format(start).replace(".", ""),
      date: formatDateFull(e.starts_at, "uz"),
      time: e.all_day ? "Butun kun" : `${time.format(start)}${end ? `–${time.format(end)}` : ""}`,
      location: e.location,
      upcoming: (end ?? start).getTime() >= now,
      telegram: e.telegram_posts.length > 0,
      published: e.is_published,
    };
  });
}

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { data: events } = await supabase
    .from("events")
    .select("id, title_uz, location, category, all_day, starts_at, ends_at, is_published, telegram_posts(post_id)")
    .order("starts_at", { ascending: false });

  const items = toItems(events ?? []);

  return (
    <>
      <AdminHeader title="Tadbirlar" action={{ href: "/admin/events/new", label: "+ Yangi tadbir" }} />
      {items.length ? (
        <EventList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali tadbir yo‘q.</p>
      )}
    </>
  );
}
