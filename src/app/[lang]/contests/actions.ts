"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type EntryValues = {
  pupil_name: string;
  grade: string;
  class_letter: string;
  parent_phone: string;
  teacher: string;
  note: string;
};

export type EntryState = {
  status: "idle" | "success" | "invalid" | "grade" | "closed" | "error" | "tooMany";
  code?: string;
  values?: EntryValues;
  attempt?: number;
};

const field = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);

/**
 * Signs a pupil up for a contest. The database decides whether the contest is still open and whether the
 * grade fits, so a stale page cannot slip an entry in after sign-up closed.
 */
export async function enterContest(prev: EntryState, form: FormData): Promise<EntryState> {
  if (field(form, "website", 200)) return { status: "success" };

  const values: EntryValues = {
    pupil_name: field(form, "pupil_name", 200),
    grade: field(form, "grade", 2),
    class_letter: field(form, "class_letter", 2),
    parent_phone: field(form, "parent_phone", 50),
    teacher: field(form, "teacher", 200),
    note: field(form, "note", 1000),
  };
  const attempt = (prev.attempt ?? 0) + 1;
  if (values.pupil_name.length < 3 || values.parent_phone.length < 7 || !values.grade) {
    return { status: "invalid", values, attempt };
  }

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values, attempt };

  const { data, error } = await supabase.rpc("enter_contest", { p: { ...values, slug: field(form, "slug", 100) } });
  const result = data as { ok?: boolean; code?: string; error?: string } | null;
  if (error || !result?.ok) {
    const kind = result?.error;
    if (kind === "rate_limited") return { status: "tooMany", values, attempt };
    if (kind === "grade") return { status: "grade", values, attempt };
    if (kind === "closed") return { status: "closed", values, attempt };
    if (kind === "invalid") return { status: "invalid", values, attempt };
    // A child's details are never logged.
    console.error(`[contest] failed: ${kind ?? error?.code ?? "unknown"}`);
    return { status: "error", values, attempt };
  }
  return { status: "success", code: result.code };
}
