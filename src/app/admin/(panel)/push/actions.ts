"use server";

import { revalidatePath } from "next/cache";
import webpush from "web-push";
import { requireAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/school";

/**
 * "Ishga tushirish": makes the VAPID key pair here on the server and stores it in the database (once — the database
 * refuses to replace it). Nobody ever sees the private half.
 */
export async function setupPush() {
  const { supabase } = await requireAdmin();
  const keys = webpush.generateVAPIDKeys();
  await supabase.rpc("push_setup", { p_public: keys.publicKey, p_private: keys.privateKey });
  revalidatePath("/admin/push");
}

/** Sends a test notification to the admin's own browser (it must have subscribed on the site first). */
export async function sendTestPush(endpoint: string): Promise<"ok" | "missing" | "failed" | "nokeys"> {
  const { supabase } = await requireAdmin();
  const { data: keys } = await supabase.rpc("push_admin_keys");
  const vapid = keys as { public: string | null; private: string | null } | null;
  if (!vapid?.public || !vapid.private) return "nokeys";
  const { data } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("endpoint", endpoint).maybeSingle();
  if (!data) return "missing";
  webpush.setVapidDetails(siteUrl, vapid.public, vapid.private);
  try {
    await webpush.sendNotification(
      { endpoint: data.endpoint, keys: { p256dh: data.p256dh, auth: data.auth } },
      JSON.stringify({ title: "14-maktab — sinov", body: "Bildirishnomalar ishlayapti ✓", url: "/uz/news", tag: "test" }),
      { TTL: 600, timeout: 10_000 },
    );
    return "ok";
  } catch {
    return "failed";
  }
}
