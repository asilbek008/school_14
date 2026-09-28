"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type Found = {
  /** Which queue the code belongs to: an admission application or an ordered reference. */
  sort: "admission" | "reference";
  /** The reference type, or the grade applied for. */
  kind: string;
  status: string;
  created_at: string;
  ready_at: string | null;
};

export type StatusState = { state: "idle" | "found" | "missing" | "error"; code?: string; found?: Found };

/**
 * Looks a request up by its code. The database returns only the kind, the state and the dates — no name and
 * no phone — so a code seen by the wrong person still says nothing about a child.
 */
export async function checkStatus(_prev: StatusState, form: FormData): Promise<StatusState> {
  const code = String(form.get("code") ?? "").trim().slice(0, 40);
  if (code.length < 6) return { state: "missing", code };

  const supabase = createPublicClient();
  if (!supabase) return { state: "error", code };

  const { data, error } = await supabase.rpc("request_status", { p_code: code });
  if (error) {
    console.error(`[status] lookup failed: ${error.code ?? "unknown"}`);
    return { state: "error", code };
  }
  const result = data as ({ ok?: boolean } & Found) | null;
  return result?.ok ? { state: "found", code, found: result } : { state: "missing", code };
}
