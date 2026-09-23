"use client";

import { useTransition } from "react";

export default function DeleteButton({ action, confirmText }: { action: () => Promise<void>; confirmText: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => confirm(confirmText) && startTransition(() => action())}
      className="text-sm text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? "O‘chirilmoqda…" : "O‘chirish"}
    </button>
  );
}
