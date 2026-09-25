"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { text, type FormState } from "@/lib/admin";
import { logAdminLogin } from "@/lib/login-log";

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const email = text(form, "email").toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: String(form.get("password") ?? ""),
  });
  if (error || !data.user) {
    await logAdminLogin(supabase, { event: "failed", email, reason: error?.code ?? "invalid" });
    return { error: "Email yoki parol noto‘g‘ri." };
  }

  // A valid account that is not in `admins` is turned away here, not left signed in.
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await logAdminLogin(supabase, { event: "failed", email, reason: "not_admin" });
    await supabase.auth.signOut();
    return { error: "Bu hisobga admin panelga kirish ruxsati berilmagan." };
  }

  await logAdminLogin(supabase, { event: "login", userId: data.user.id, email: data.user.email ?? email });
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    await logAdminLogin(supabase, { event: "logout", userId: data.claims.sub, email: (data.claims.email as string | undefined) ?? "" });
  }
  await supabase.auth.signOut();
  redirect("/admin/login");
}
