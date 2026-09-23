"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { text, type FormState } from "@/lib/admin";

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(form, "email"),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Email yoki parol noto‘g‘ri." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
