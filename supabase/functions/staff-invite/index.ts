// Creating an admin-panel account from an invite (owner's request): an admin makes the invite in the panel,
// the new member opens the link and picks their own password. Only this function may create the account —
// it runs with the service role Supabase injects, so the site's code never holds a key that could.
// Deployed with verify_jwt off: whoever opens the link is not signed in yet. The invite token is the proof.

import { createClient } from "npm:@supabase/supabase-js@2";

/** The rules shown on the page, checked again here so a hand-made request cannot skip them. */
export const rules = [
  { id: "len", test: (p: string) => p.length >= 10 },
  { id: "upper", test: (p: string) => /\p{Lu}/u.test(p) },
  { id: "digit", test: (p: string) => /\d/.test(p) },
  { id: "symbol", test: (p: string) => /[^\p{L}\p{N}]/u.test(p) },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 200);
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const body = (await req.json().catch(() => null)) as { token?: string; password?: string } | null;
  const token = (body?.token ?? "").trim();
  if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "unknown" }, 400);

  const { data: found } = await db.rpc("staff_invite_lookup", { p_token: token });
  const invite = found as { ok?: boolean; email?: string; role?: string; error?: string } | null;
  if (!invite?.ok) return json({ error: invite?.error ?? "unknown" }, 400);

  // No password: the page is only asking who the link is for.
  const password = body?.password;
  if (password === undefined) return json({ ok: true, email: invite.email, role: invite.role });

  if (rules.some((rule) => !rule.test(password))) return json({ error: "weak" }, 400);

  const { data: created, error } = await db.auth.admin.createUser({
    email: invite.email!,
    password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    console.error("create user failed", error?.status ?? "");
    return json({ error: error?.message?.includes("already") ? "exists" : "failed" }, 400);
  }

  const { data: done } = await db.rpc("staff_invite_complete", { p_token: token, p_user: created.user.id });
  if (!(done as { ok?: boolean } | null)?.ok) {
    // The invite went stale between the two steps: remove the half-made account rather than leave it.
    await db.auth.admin.deleteUser(created.user.id);
    return json({ error: "unknown" }, 400);
  }
  return json({ ok: true, email: invite.email });
});
