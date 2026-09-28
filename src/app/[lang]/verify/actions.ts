"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type Certificate = {
  code: string;
  name: string;
  test: string;
  percent: number;
  correct: number;
  total: number;
  issued_on: string;
};

export type VerifyState = { state: "idle" | "valid" | "unknown" | "error"; code?: string; cert?: Certificate };

/**
 * Checks a certificate by its code. Unlike the request lookup, this one does return the name — confirming
 * that the name on the paper is the name that was issued is the whole point of checking.
 */
export async function verifyCertificate(_prev: VerifyState, form: FormData): Promise<VerifyState> {
  const code = String(form.get("code") ?? "").trim().slice(0, 40);
  if (code.length < 6) return { state: "unknown", code };

  const supabase = createPublicClient();
  if (!supabase) return { state: "error", code };

  const { data, error } = await supabase.rpc("verify_certificate", { p_code: code });
  if (error) {
    console.error(`[verify] lookup failed: ${error.code ?? "unknown"}`);
    return { state: "error", code };
  }
  const result = data as ({ ok?: boolean } & Certificate) | null;
  return result?.ok ? { state: "valid", code, cert: result } : { state: "unknown", code };
}
