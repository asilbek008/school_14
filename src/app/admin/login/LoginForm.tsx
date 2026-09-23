"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  const error = state.error ?? notice;

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Parol
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
