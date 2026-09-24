"use server";

import { trustTopics, type TrustTopic } from "@/lib/categories";
import { createPublicClient } from "@/lib/supabase/public";

export type TrustState = { status: "idle" | "success" | "invalid" | "error" | "tooMany"; attempt?: number };

/**
 * A trust-box message. Nothing about the sender is kept: no name, no IP — only the topic, the text and
 * the contact they chose to add. The values are not echoed back either, so a shared computer keeps nothing.
 */
export async function sendTrustMessage(prev: TrustState, form: FormData): Promise<TrustState> {
  const attempt = (prev.attempt ?? 0) + 1;
  // Honeypot: real people never see this field.
  if (String(form.get("website") ?? "").trim()) return { status: "success" };

  const raw = String(form.get("topic") ?? "");
  const topic: TrustTopic = trustTopics.includes(raw as TrustTopic) ? (raw as TrustTopic) : "boshqa";
  const message = String(form.get("message") ?? "").trim().slice(0, 5000);
  const contact = String(form.get("contact") ?? "").trim().slice(0, 320);
  if (message.length < 10) return { status: "invalid", attempt };

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", attempt };

  const { error } = await supabase.from("trust_messages").insert({ topic, message, contact: contact || null });
  if (error?.message.includes("rate_limited")) return { status: "tooMany", attempt };
  if (error) {
    // The text itself is never logged: it may be sensitive.
    console.error(`[trust] insert failed: ${error.code ?? "unknown"}`);
    return { status: "error", attempt };
  }
  return { status: "success" };
}
