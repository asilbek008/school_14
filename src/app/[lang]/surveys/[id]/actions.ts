"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type SurveyState = { ok?: boolean; error?: "error" | "tooMany" | "required" };

type Question = { id: number; kind: string; required: boolean; options_uz: string[] };

/**
 * Writes one filled-in form. Nothing about the sender is stored or logged — only the answers, checked
 * against the survey's own questions so that a hand-made request cannot put anything else in the box.
 */
export async function submitSurvey(surveyId: number, _prev: SurveyState, form: FormData): Promise<SurveyState> {
  const supabase = createPublicClient();
  if (!supabase) return { error: "error" };

  const { data: questions } = await supabase.from("survey_questions").select("id, kind, required, options_uz").eq("survey_id", surveyId);
  const list = (questions ?? []) as Question[];
  if (!list.length) return { error: "error" };

  const answers: Record<string, number | number[] | string> = {};
  for (const q of list) {
    const raw = form.getAll(`q${q.id}`).map((v) => String(v)).filter((v) => v !== "");
    if (!raw.length) {
      if (q.required) return { error: "required" };
      continue;
    }
    if (q.kind === "text") {
      answers[q.id] = raw[0].slice(0, 1000);
    } else if (q.kind === "scale") {
      const n = Number(raw[0]);
      if (!Number.isInteger(n) || n < 1 || n > 5) return { error: "error" };
      answers[q.id] = n;
    } else {
      const picked = [...new Set(raw.map(Number))].filter((n) => Number.isInteger(n) && n >= 0 && n < q.options_uz.length);
      if (!picked.length) return { error: q.required ? "required" : "error" };
      answers[q.id] = q.kind === "multi" ? picked.sort((a, b) => a - b) : picked[0];
    }
  }
  if (!Object.keys(answers).length) return { error: "required" };

  const { error } = await supabase.from("survey_responses").insert({ survey_id: surveyId, answers });
  // The message itself is not logged: it may hold an opinion the sender wants kept to themselves.
  if (error) return { error: error.message.includes("rate_limited") ? "tooMany" : "error" };
  return { ok: true };
}
