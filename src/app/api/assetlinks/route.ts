import { NextResponse } from "next/server";

/**
 * Digital Asset Links: tells Android that the Play Store app signed with this certificate may open
 * the site's pages as its own, which is what removes the browser address bar from the app.
 *
 * The fingerprint is not a secret — every published app carries it — but it is only known once the
 * school has made its signing key, so it comes from the ANDROID_CERT_SHA256 environment variable
 * (Vercel → Settings → Environment Variables). Several fingerprints may be listed, separated by
 * commas: Play App Signing gives one, the upload key another, and both must be here.
 *
 * Served at /.well-known/assetlinks.json through a rewrite in next.config.ts.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));

  const statements = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "uz.maktab14.qiziriq",
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return NextResponse.json(statements, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
