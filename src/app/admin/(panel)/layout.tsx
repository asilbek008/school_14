import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import ExcludeDevice from "@/components/admin/ExcludeDevice";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { email, supabase } = await requireAdmin();
  // Unread counts shown next to their menu entries.
  const unreadIn = (table: string) => supabase.from(table).select("id", { count: "exact", head: true }).eq("is_read", false);
  const [{ count: unread }, { count: unreadTrust }, { count: newApplications }] = await Promise.all([
    unreadIn("contact_messages"),
    unreadIn("trust_messages"),
    // Applications have no "read" flag: the ones still waiting are those left at their initial status.
    supabase.from("admission_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const badges = {
    "/admin/messages": unread ?? 0,
    "/admin/trust": unreadTrust ?? 0,
    "/admin/applications": newApplications ?? 0,
  };

  return (
    <>
      {/* The admin's own browsing is left out of the visitor statistics. */}
      <ExcludeDevice />
      <AdminNav email={email} badges={badges}>
        {children}
      </AdminNav>
    </>
  );
}
