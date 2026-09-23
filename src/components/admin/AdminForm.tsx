"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/admin";

/**
 * Wraps an admin Server Action. Submits via onSubmit instead of the `action` prop so React
 * doesn't reset the form: on a validation error the admin keeps everything they typed.
 * On success the action redirects, so only errors come back.
 */
export default function AdminForm({
  action,
  submitLabel = "Saqlash",
  children,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => setState(await action(state, form)));
      }}
      className="space-y-6 rounded-xl bg-white p-6 shadow-sm"
    >
      {children}
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda…" : submitLabel}
      </button>
    </form>
  );
}
