"use server";

import { createPublicClient } from "@/lib/supabase/public";

type Values = { name: string; email: string; phone: string; message: string };

// `values` is echoed back so the form can refill itself: React resets forms after an action.
export type ContactState = {
  status: "idle" | "success" | "invalid" | "needContact" | "error";
  values?: Values;
};

const field = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "").trim().slice(0, max);

export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real users never see or fill this field.
  if (field(form, "website", 200)) return { status: "success" };

  const name = field(form, "name", 200);
  const email = field(form, "email", 320);
  const phone = field(form, "phone", 50);
  const message = field(form, "message", 5000);

  const values = { name, email, phone, message };

  if (!name || !message) return { status: "invalid", values };
  if (!email && !phone) return { status: "needContact", values };

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values };

  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email: email || null, phone: phone || null, message });
  if (error) {
    console.error(`[contact] insert failed: ${error.message}`);
    return { status: "error", values };
  }
  return { status: "success" };
}
