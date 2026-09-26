import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { editorMay, type StaffRole } from "@/lib/roles";

/**
 * Returns a Supabase client acting as the signed-in admin, or redirects to the login page.
 * Call at the top of every admin page AND every admin Server Action: proxy.ts only checks
 * that a session exists, not that the user is in `public.admins`.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  // RLS lets a user read only their own admins row, so a hit means "is staff".
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, role")
    .eq("user_id", data.claims.sub)
    .maybeSingle();
  if (!admin) redirect("/admin/login?error=forbidden");

  // 2FA turned on but this session has not passed the second step yet (the database refuses it anyway).
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/admin/login/mfa");

  const role = (admin.role === "editor" ? "editor" : "admin") as StaffRole;
  if (role === "editor" && !editorMay((await headers()).get("x-admin-path") ?? "")) redirect("/admin?denied=1");

  return { supabase, email: (data.claims.email as string | undefined) ?? "", role, userId: data.claims.sub };
}

/** Refreshes every public page after content changes (the site is small). */
export function revalidatePublic() {
  revalidatePath("/[lang]", "layout");
}

export type FormState = { error?: string; ok?: boolean };

export function text(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** Like text(), but empty strings become null (for optional translated columns). */
export function optional(form: FormData, name: string): string | null {
  return text(form, name) || null;
}

/** The "O‘quv yili" select: a start year, or null for "by date". */
export function schoolYear(form: FormData): number | null {
  const y = Number(text(form, "school_year"));
  return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : null;
}

/** Turns "Yangi o‘quv yili!" into "yangi-oquv-yili". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
