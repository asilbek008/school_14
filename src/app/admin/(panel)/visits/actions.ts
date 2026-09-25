"use server";

import { requireAdmin } from "@/lib/admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Removes this browser's page views from the statistics: it belongs to an admin, not a visitor. */
export async function forgetAdminDevice(visitor: string) {
  const { supabase } = await requireAdmin();
  if (!uuid.test(visitor)) return;
  await supabase.from("site_visits").delete().eq("visitor", visitor);
}
