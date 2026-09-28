"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type ReferenceValues = {
  kind: string;
  child_name: string;
  grade: string;
  parent_name: string;
  phone: string;
  purpose: string;
  note: string;
};

export type ReferenceState = {
  status: "idle" | "success" | "invalid" | "error" | "tooMany";
  /** Shown once, on success: the parent writes it down to follow the request. */
  code?: string;
  values?: ReferenceValues;
  attempt?: number;
};

const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);

/**
 * Orders a reference. The insert goes through `submit_reference` rather than the table, because the parent
 * needs the code back and nobody may read this table from the site — it holds a child's name.
 */
export async function orderReference(prev: ReferenceState, form: FormData): Promise<ReferenceState> {
  if (field(form, "website", 200)) return { status: "success" };

  const values: ReferenceValues = {
    kind: field(form, "kind", 20),
    child_name: field(form, "child_name", 200),
    grade: field(form, "grade", 2),
    parent_name: field(form, "parent_name", 200),
    phone: field(form, "phone", 50),
    purpose: field(form, "purpose", 300),
    note: field(form, "note", 2000),
  };
  const attempt = (prev.attempt ?? 0) + 1;

  if (values.child_name.length < 3 || values.parent_name.length < 3 || values.phone.length < 7) {
    return { status: "invalid", values, attempt };
  }

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values, attempt };

  const { data, error } = await supabase.rpc("submit_reference", { p: values });
  const result = data as { ok?: boolean; code?: string; error?: string } | null;
  if (error || !result?.ok) {
    if (result?.error === "rate_limited") return { status: "tooMany", values, attempt };
    if (result?.error === "invalid") return { status: "invalid", values, attempt };
    // A child's details are never logged.
    console.error(`[reference] failed: ${result?.error ?? error?.code ?? "unknown"}`);
    return { status: "error", values, attempt };
  }
  return { status: "success", code: result.code };
}
