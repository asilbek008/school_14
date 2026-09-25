import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { requestOrigin } from "@/lib/login-log";

// Page views sent by VisitBeacon. The visitor is anonymous (a random browser id); only the page, the
// approximate place and the device type are kept — the IP is read for nothing and stored nowhere.

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bots = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|monitor/i;

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 2000) return new Response(null, { status: 413 });
  let body: { path?: unknown; visitor?: unknown; session?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 300) : "";
  const visitor = typeof body.visitor === "string" ? body.visitor : "";
  const session = typeof body.session === "string" ? body.session : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || !uuid.test(visitor) || !uuid.test(session)) {
    return new Response(null, { status: 400 });
  }

  // A signed-in admin browsing the site is not a visitor (even if the browser mark was cleared).
  if ((await cookies()).getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))) {
    const { data } = await (await createClient()).auth.getClaims();
    if (data?.claims) return new Response(null, { status: 204 });
  }

  const origin = await requestOrigin();
  if (!origin.user_agent || bots.test(origin.user_agent)) return new Response(null, { status: 204 });

  const lang = path.split("/")[1];
  const referrer = typeof body.referrer === "string" && /^[a-z0-9.-]{3,100}$/i.test(body.referrer) ? body.referrer.toLowerCase() : null;
  const supabase = createPublicClient();
  if (supabase) {
    const { error } = await supabase.from("site_visits").insert({
      path,
      lang: ["uz", "ru", "en"].includes(lang) ? lang : null,
      visitor,
      session,
      referrer,
      city: origin.city,
      region: origin.region?.slice(0, 10) ?? null,
      country: origin.country,
      device: origin.device,
      mobile: /\((telefon|planshet)\)$/.test(origin.device ?? ""),
    });
    if (error) console.error(`[visit] ${error.code ?? "unknown"}`);
  }
  return new Response(null, { status: 204 });
}
