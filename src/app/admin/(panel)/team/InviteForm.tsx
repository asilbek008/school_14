"use client";

import { useActionState, useState } from "react";
import { roleNames, type StaffRole } from "@/lib/roles";
import { inviteStaff, type InviteState } from "./actions";

const roles: StaffRole[] = ["editor", "teacher", "admin"];
const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

/** Invite a colleague and hand them the link; the password is theirs to choose. */
export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteStaff, {} as InviteState);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (an old browser): the link is on screen to copy by hand.
    }
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Yangi xodimni taklif qilish</h2>
      <p className="mt-1 text-sm text-slate-600">
        Email va rolni yozing — panel bir martalik havola beradi. Havolani xodimga Telegram orqali yuboring: u o‘zi parol o‘ylab
        topadi va panelga kiradi. Havola 7 kun amal qiladi va bir marta ishlaydi.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[16rem] flex-1 text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required placeholder="ism@gmail.com" autoComplete="off" className={input} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Roli
          <select name="role" defaultValue="editor" className={input}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleNames[role]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Yaratilmoqda…" : "Havola yaratish"}
        </button>
      </form>

      {state.error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      {state.link && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-900">
          <p className="font-semibold">{state.email} uchun havola tayyor:</p>
          <p className="mt-1 break-all font-mono text-[12.5px]">{state.link}</p>
          <button type="button" onClick={copy} className="mt-2 rounded-lg border border-green-300 px-3 py-1.5 text-xs font-semibold hover:bg-green-100">
            {copied ? "✓ Nusxalandi" : "Havolani nusxalash"}
          </button>
        </div>
      )}
    </div>
  );
}
