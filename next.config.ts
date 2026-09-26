import type { NextConfig } from "next";

// Photos are served from the Supabase Storage "media" bucket of the configured project.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

// Security headers for every response. No full Content-Security-Policy: the theme script is inline, and the
// map and videos come from Google and YouTube; frame-ancestors alone stops other sites framing ours.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      supabaseUrl
        ? {
            protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          }
        : { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // Fewer transformations on Vercel's free plan: uploaded files never change (a new version gets a new name —
    // uuids, Telegram "-hd" copies), so a resized copy is kept for a month, and only a handful of widths are
    // made (phone, tablet, desktop, full screen; small ones for thumbnails and avatars).
    minimumCacheTTL: 60 * 60 * 24 * 31,
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    // Only for a local Supabase stack (http://localhost:54321); never true in production.
    dangerouslyAllowLocalIP: supabaseUrl?.hostname === "localhost",
  },
};

export default nextConfig;
