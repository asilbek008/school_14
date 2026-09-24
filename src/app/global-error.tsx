"use client";

import Link from "next/link";

// Last resort when even the site's layout fails: a plain page with its own <html>, in the three languages.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="uz">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f6fa", color: "#131a2e", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 56, fontWeight: 800, margin: 0, color: "#e0a33e" }}>!</p>
          <h1 style={{ fontSize: 20 }}>Xatolik yuz berdi · Произошла ошибка · Something went wrong</h1>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#2c5ce0", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Qayta urinish · Повторить · Try again
          </button>
          <p style={{ marginTop: 16 }}>
            <Link href="/" style={{ color: "#2c5ce0" }}>
              14-maktab
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
