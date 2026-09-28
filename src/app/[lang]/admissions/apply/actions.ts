"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type ApplyValues = {
  child_name: string;
  child_birth_date: string;
  grade: string;
  parent_name: string;
  phone: string;
  address: string;
  previous_school: string;
  note: string;
};
export type ApplyState = {
  status: "idle" | "success" | "invalid" | "badDate" | "error" | "tooMany";
  /** Shown once, on success: the parent writes it down to follow the application. */
  code?: string;
  values?: ApplyValues;
  attempt?: number;
};

const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);

/** An admission application. The child's details are stored for the school only, never shown on the site. */
export async function sendApplication(prev: ApplyState, form: FormData): Promise<ApplyState> {
  if (field(form, "website", 200)) return { status: "success" };

  const values: ApplyValues = {
    child_name: field(form, "child_name", 200),
    child_birth_date: field(form, "child_birth_date", 10),
    grade: field(form, "grade", 2),
    parent_name: field(form, "parent_name", 200),
    phone: field(form, "phone", 50),
    address: field(form, "address", 500),
    previous_school: field(form, "previous_school", 300),
    note: field(form, "note", 2000),
  };
  const attempt = (prev.attempt ?? 0) + 1;
  const grade = Number(values.grade);

  if (values.child_name.length < 3 || values.parent_name.length < 3 || values.phone.length < 7 || !(grade >= 1 && grade <= 11)) {
    return { status: "invalid", values, attempt };
  }
  // A pupil is between 5 and 20: anything else is a slip of the finger.
  const born = new Date(values.child_birth_date);
  const age = (Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (!values.child_birth_date || Number.isNaN(born.getTime()) || age < 5 || age > 20) return { status: "badDate", values, attempt };

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values, attempt };

  const { data, error } = await supabase.rpc("submit_admission", { p: values });
  const result = data as { ok?: boolean; code?: string; error?: string } | null;
  if (error || !result?.ok) {
    if (result?.error === "rate_limited") return { status: "tooMany", values, attempt };
    if (result?.error === "invalid") return { status: "invalid", values, attempt };
    // The child's details are never logged.
    console.error(`[apply] failed: ${result?.error ?? error?.code ?? "unknown"}`);
    return { status: "error", values, attempt };
  }
  return { status: "success", code: result.code };
}
