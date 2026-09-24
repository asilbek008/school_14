"use server";

import { contactTopics, type ContactTopic } from "@/lib/categories";
import { createPublicClient } from "@/lib/supabase/public";

type Values = { name: string; email: string; phone: string; topic: string; message: string };

// `values` is echoed back so the form can refill itself: React resets forms after an action.
export type ContactState = {
  status: "idle" | "success" | "invalid" | "needContact" | "error" | "tooMany";
  values?: Values;
  attempt?: number; // counts sends, so the form can remount what a reset would not refill
};

const field = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "").trim().slice(0, max);

export async function sendContactMessage(prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real users never see or fill this field.
  if (field(form, "website", 200)) return { status: "success" };

  const name = field(form, "name", 200);
  const email = field(form, "email", 320);
  const phone = field(form, "phone", 50);
  const message = field(form, "message", 5000);
  const raw = field(form, "topic", 20);
  const topic = contactTopics.includes(raw as ContactTopic) ? raw : "";

  const values = { name, email, phone, topic, message };
  const attempt = (prev.attempt ?? 0) + 1;

  if (!name || !message) return { status: "invalid", values, attempt };
  if (!email && !phone) return { status: "needContact", values, attempt };

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values, attempt };

  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email: email || null, phone: phone || null, topic: topic || null, message });
  // Too many messages from this phone/email (or in all) just now: the database refuses them.
  if (error?.message.includes("rate_limited")) return { status: "tooMany", values, attempt };
  if (error) {
    console.error(`[contact] insert failed: ${error.message}`);
    return { status: "error", values, attempt };
  }
  return { status: "success" };
}
