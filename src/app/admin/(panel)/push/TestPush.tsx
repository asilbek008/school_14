"use client";

import { useState } from "react";
import { sendTestPush } from "./actions";

const messages = {
  ok: "Yuborildi — bir necha soniyada bildirishnoma chiqadi.",
  missing: "Bu brauzer obuna bo‘lmagan. Saytdagi «Yangiliklar» sahifasida «Bildirishnomani yoqish» tugmasini bosing, keyin qayta urinib ko‘ring.",
  failed: "Yuborib bo‘lmadi. Brauzerda bildirishnomalar ruxsat etilganini tekshiring.",
  nokeys: "Bildirishnomalar hali ishga tushirilmagan.",
};

/** "Sinov bildirishnomasi" — to this browser only. */
export default function TestPush() {
  const [result, setResult] = useState<keyof typeof messages | "busy" | null>(null);

  async function run() {
    setResult("busy");
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/") : undefined;
      const sub = await registration?.pushManager.getSubscription();
      setResult(sub ? await sendTestPush(sub.endpoint) : "missing");
    } catch {
      setResult("failed");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={result === "busy"}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {result === "busy" ? "Yuborilmoqda…" : "Shu brauzerga sinov bildirishnomasi"}
      </button>
      {result && result !== "busy" && (
        <p className={`mt-2 text-sm ${result === "ok" ? "text-green-700" : "text-red-700"}`}>{messages[result]}</p>
      )}
    </div>
  );
}
