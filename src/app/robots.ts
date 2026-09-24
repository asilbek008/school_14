import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/school";

/** Search engines may index the public site, not the admin panel. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
