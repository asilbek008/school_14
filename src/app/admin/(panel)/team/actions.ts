"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, text } from "@/lib/admin";
import { siteUrl } from "@/lib/school";

/** The database refuses what the page already hides (yourself, the owner, the last admin) — say which. */
const refusals: Record<string, string> = {
  owner: "Super admin hisobini o‘zgartirib bo‘lmaydi.",
  "own role": "O‘z rolingizni o‘zgartira olmaysiz.",
  self: "O‘zingizni ro‘yxatdan chiqara olmaysiz.",
  "last admin": "Bu oxirgi admin — maktab panelsiz qolmasligi uchun o‘zgartirilmaydi.",
};

function explain(message: string | undefined): string {
  const key = Object.keys(refusals).find((k) => message?.includes(k));
  return key ? refusals[key] : "Amal bajarilmadi. Sahifani yangilab, qaytadan urinib ko‘ring.";
}

export type TeamState = { error?: string };

export async function setRole(_prev: TeamState, form: FormData): Promise<TeamState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("set_admin_role", {
    p_user: text(form, "user"),
    p_role: text(form, "role"),
  });
  if (error) return { error: explain(error.message) };
  revalidatePath("/admin/team");
  return {};
}

/** Takes someone off the team: their admins row goes, and with it every permission the policies grant. */
export async function removeStaff(_prev: TeamState, form: FormData): Promise<TeamState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("remove_admin", { p_user: text(form, "user") });
  if (error) return { error: explain(error.message) };
  revalidatePath("/admin/team");
  return {};
}

/**
 * Clears a second step someone can no longer pass: `mfa` for a lost authenticator app, `tg` for a lost
 * Telegram account. They sign in with their password and set it up again from "Ikki bosqichli kirish".
 */
export async function resetSecond(_prev: TeamState, form: FormData): Promise<TeamState> {
  const { supabase } = await requireAdmin();
  const user = text(form, "user");
  const { error } =
    text(form, "kind") === "tg"
      ? await supabase.rpc("admin_tg_reset", { p_user: user })
      : await supabase.rpc("reset_mfa", { p_user: user });
  if (error) return { error: explain(error.message) };
  revalidatePath("/admin/team");
  return {};
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
