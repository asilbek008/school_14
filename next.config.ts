import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photos are served from the Supabase Storage "media" bucket.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
