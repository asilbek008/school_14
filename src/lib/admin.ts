import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a Supabase client acting as the signed-in admin, or redirects to the login page.
 * Call at the top of every admin page AND every admin Server Action: proxy.ts only checks
 * that a session exists, not that the user is in `public.admins`.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?error=forbidden");

  return { supabase, email: (data.claims.email as string | undefined) ?? "" };
}

/** Refreshes every public page after content changes (the site is small). */
export function revalidatePublic() {
  revalidatePath("/[lang]", "layout");
}

export type FormState = { error?: string };

export function text(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** Like text(), but empty strings become null (for optional translated columns). */
export function optional(form: FormData, name: string): string | null {
  return text(form, name) || null;
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
