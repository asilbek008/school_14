"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function setRole(userId: string, role: "admin" | "editor") {
  const { supabase } = await requireAdmin();
  await supabase.rpc("set_admin_role", { p_user: userId, p_role: role });
  revalidatePath("/admin/team");
}

/** For someone who lost the phone with their authenticator app: they sign in with the password again and can turn it back on. */
export async function resetMfa(userId: string) {
  const { supabase } = await requireAdmin();
  await supabase.rpc("reset_mfa", { p_user: userId });
  revalidatePath("/admin/team");
}

/** For someone who lost the Telegram account that gets the code: they link the bot again from "Ikki bosqichli kirish". */
export async function resetTg(userId: string) {
  const { supabase } = await requireAdmin();
  await supabase.rpc("admin_tg_reset", { p_user: userId });
  revalidatePath("/admin/team");
}
