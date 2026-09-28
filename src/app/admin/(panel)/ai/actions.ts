"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, revalidatePublic, text, type FormState } from "@/lib/admin";
import { readEvents } from "@/lib/sse";

/**
 * Saves the model key. The key itself is written straight into the database and never read back into the
 * panel: the page only ever learns whether one is there.
 */
export async function saveAi(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  // Quotes and spaces come along when a key is pasted from a note or a chat; a real key has neither.
  const key = text(form, "api_key").replace(/\s/g, "").replace(/^["'«»]+|["'«»]+$/g, "");
  if (key && !/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
    return {
      error:
        key.length < 40
          ? "Kalit qisqa ko‘rinadi — u odatda 100 dan ortiq belgidan iborat. Konsolda «Copy» tugmasi bilan to‘liq nusxalang."
          : "Kalit noto‘g‘ri ko‘rinishda. Anthropic konsolidagi to‘liq kalitni nusxalang (sk-ant-… bilan boshlanadi).",
    };
  }
  const { error } = await supabase.rpc("ai_save", {
    p_key: key || null,
    p_model: text(form, "model") || null,
    p_enabled: form.get("enabled") === "on",
  });
  if (error) return { error: `Saqlab bo‘lmadi: ${error.message}` };
  revalidatePath("/admin/ai");
  revalidatePublic();
  return { ok: true };
}

export async function forgetAi() {
  const { supabase } = await requireAdmin();
  await supabase.rpc("ai_forget");
  revalidatePath("/admin/ai");
  revalidatePublic();
}

export type TestState = { ok?: boolean; answer?: string; error?: string };

const problems: Record<string, string> = {
  off: "Kalit kiritilmagan yoki «Saytda yoqilgan bo‘lsin» belgilanmagan.",
  key: "Kalitni Anthropic qabul qilmadi. Konsolda yangi kalit yarating va to‘liq nusxalang.",
  too_many: "Hozir juda ko‘p so‘rov bor yoki hisobdagi limit tugagan. Bir ozdan keyin urinib ko‘ring.",
  model: "Model javob bermadi. Ko‘pincha sabab: hisobda kredit yo‘q (Console → Billing) yoki tanlangan model hisobingizga ochilmagan.",
  refused: "Model bu savolga javob bermadi, lekin ulanish ishlayapti.",
  empty: "Savol juda qisqa.",
  cut: "Javob boshlandi, lekin to‘liq kelmadi. Ulanish ishlayapti — qaytadan urinib ko‘ring.",
};

/**
 * Sends one real question through the assistant, so the admin sees at once whether the key works. The
 * function streams its answer to the site; here there is nobody watching it arrive, so the whole stream is
 * read and shown at once. Anything that fails before the first word still comes back as plain JSON.
 */
export async function testAi(): Promise<TestState> {
  await requireAdmin();
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
      body: JSON.stringify({ question: "Maktabning telefon raqami va ish vaqti qanday?", lang: "uz", visitor: "admin-test" }),
      cache: "no-store",
    });

    if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("event-stream")) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: problems[data.error ?? ""] ?? `Ulanmadi (${res.status}).` };
    }

    let answer = "";
    let failed = "";
    for (const event of readEvents(await res.text()).events) {
      if (event.text) answer += event.text;
      else if (event.error) failed = event.error;
    }
    if (answer) return { ok: true, answer };
    return { error: problems[failed] ?? "Model javob bermadi." };
  } catch {
    return { error: "Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring." };
  }
}
