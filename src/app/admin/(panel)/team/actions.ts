"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, text } from "@/lib/admin";
import { siteUrl } from "@/lib/school";
import type { StaffRole } from "@/lib/roles";

export async function setRole(userId: string, role: StaffRole) {
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

export type InviteState = { error?: string; link?: string; email?: string };

const problems: Record<string, string> = {
  email: "Email noto‘g‘ri yozilgan.",
  role: "Rolni tanlang.",
  exists: "Bu email bilan hisob allaqachon bor.",
};

/**
 * Invites a colleague: the panel gives back a one-time link, which the admin passes to them by Telegram or
 * in person. No password is set here — the new member chooses their own when they open the link.
 */
export async function inviteStaff(_prev: InviteState, form: FormData): Promise<InviteState> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("staff_invite_create", {
    p_email: text(form, "email"),
    p_role: text(form, "role"),
  });
  if (error) return { error: `Taklif yaratilmadi: ${error.message}` };
  const result = data as { ok?: boolean; token?: string; email?: string; error?: string };
  if (!result?.ok || !result.token) return { error: problems[result?.error ?? ""] ?? "Taklif yaratilmadi." };
  revalidatePath("/admin/team");
  return { link: `${siteUrl}/admin/invite/${result.token}`, email: result.email };
}

export async function revokeInvite(id: number) {
  const { supabase } = await requireAdmin();
  await supabase.rpc("staff_invite_revoke", { p_id: id });
  revalidatePath("/admin/team");
}
