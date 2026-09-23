import type { NextConfig } from "next";

// Photos are served from the Supabase Storage "media" bucket of the configured project.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
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
    // Only for a local Supabase stack (http://localhost:54321); never true in production.
    dangerouslyAllowLocalIP: supabaseUrl?.hostname === "localhost",
  },
};

export default nextConfig;
