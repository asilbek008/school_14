"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/admin";
import { inputClass } from "./fields";

/** One field for a YouTube link; the form clears itself after a link is added. */
export default function YoutubeForm({ action }: { action: (prev: FormState, form: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="rounded-xl bg-white p-5 shadow-sm">
      <label className="block text-sm font-semibold text-slate-800">
        YouTube havolasi
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input name="url" required placeholder="https://youtu.be/…" className={`${inputClass} mt-0 flex-1`} />
          <button disabled={pending} className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {pending ? "Qo‘shilmoqda…" : "Qo‘shish"}
          </button>
        </div>
      </label>
      {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p role="status" className="mt-2 text-sm text-green-700">Video qo‘shildi.</p>}
    </form>
  );
}
