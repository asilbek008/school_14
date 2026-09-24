"use client";

import { useEffect } from "react";

/** An admin page that failed: the menu stays, with a retry and the error's reference for the developer. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-bold text-slate-900">Sahifani ochib bo‘lmadi</h1>
      <p className="mt-2 text-sm text-slate-600">Internet aloqasini tekshirib, qayta urinib ko‘ring. Xato takrorlansa, pastdagi kodni dasturchiga yuboring.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
        Qayta urinish
      </button>
      {error.digest && <p className="mt-4 font-mono text-xs text-slate-400">#{error.digest}</p>}
    </div>
  );
}
