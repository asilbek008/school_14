import type { MetadataRoute } from "next";

/** Lets phones add the site to the home screen as an app: its own icon and window, opening on the Uzbek home page. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "14-maktab — Qiziriq tumani",
    short_name: "14-maktab",
    description: "14-sonli umumta’lim maktabining rasmiy veb-sayti: dars jadvali, yangiliklar, tadbirlar",
    start_url: "/uz",
    scope: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#131a2e",
    lang: "uz",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
