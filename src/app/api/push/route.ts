import webpush from "web-push";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/school";

// Sends newly published news to push subscribers. Called by pg_cron (private.push_kick) only when something is
// waiting; the secret header is checked by the database, which also hands over the VAPID pair — this route keeps no key.

type News = { id: number; slug: string; cover: string | null } & Record<`${"title" | "body"}_${"uz" | "ru" | "en"}`, string | null>;
type Sub = { endpoint: string; p256dh: string; auth: string; lang: "uz" | "ru" | "en" };

export const maxDuration = 60;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function POST(request: Request) {
  const secret = request.headers.get("x-push-secret");
  const supabase = createPublicClient();
  if (!secret || !supabase) return new Response(null, { status: 503 });

  const { data, error } = await supabase.rpc("push_pending", { p_secret: secret });
  if (error) return new Response(null, { status: error.code === "42501" ? 403 : 500 });
  const { news, subs, vapid } = data as { news: News[]; subs: Sub[]; vapid?: { public: string | null; private: string | null } };
  if (!news.length || !subs.length || !vapid?.public || !vapid.private) return Response.json({ news: news.length, sent: 0 });

  webpush.setVapidDetails(siteUrl, vapid.public, vapid.private);
  const gone = new Set<string>();
  let sent = 0;
  const jobs = news.flatMap((n) =>
    subs.map((s) => async () => {
      const title = n[`title_${s.lang}`] || n.title_uz || "";
      const body = (n[`body_${s.lang}`] || n.body_uz || "").replace(/\s+/g, " ").trim();
      const payload = JSON.stringify({
        title: clip(title, 120),
        body: clip(body, 160),
        url: `/${s.lang}/news/${n.slug}`,
        tag: `news-${n.id}`,
      });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          timeout: 10_000,
        });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.add(s.endpoint);
      }
    }),
  );
  // A few at a time — the push services are quick, the function has a minute.
  for (let i = 0; i < jobs.length; i += 25) await Promise.all(jobs.slice(i, i + 25).map((job) => job()));

  if (gone.size) await supabase.rpc("push_forget", { p_secret: secret, p_endpoints: [...gone] });
  return Response.json({ news: news.length, sent, gone: gone.size });
}
