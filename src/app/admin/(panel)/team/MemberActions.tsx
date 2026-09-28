"use client";

import { useActionState } from "react";
import { roleIcons, roleNames, type StaffRole } from "@/lib/roles";
import { removeStaff, resetSecond, setRole, type TeamState } from "./actions";

const roles: StaffRole[] = ["admin", "editor", "teacher"];

const button = "rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-50";
const plain = `${button} border-slate-300 text-slate-700 hover:bg-slate-50`;
const danger = `${button} border-red-200 text-red-700 hover:bg-red-50`;

/**
 * What an admin can do to a colleague: change the role, clear a second step they can no longer pass,
 * or take them off the team. The owner and yourself are filtered out by the page; the database refuses
 * those cases anyway and the message comes back here.
 */
export default function MemberActions({ member }: { member: { user_id: string; email: string; role: StaffRole; mfa: boolean; tg: boolean } }) {
  const [role, changeRole, rolePending] = useActionState<TeamState, FormData>(setRole, {});
  const [second, clearSecond, secondPending] = useActionState<TeamState, FormData>(resetSecond, {});
  const [gone, remove, removePending] = useActionState<TeamState, FormData>(removeStaff, {});
  const error = role.error ?? second.error ?? gone.error;

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {roles
          .filter((r) => r !== member.role)
          .map((r) => (
            <form key={r} action={changeRole}>
              <input type="hidden" name="user" value={member.user_id} />
              <input type="hidden" name="role" value={r} />
              <button className={plain} disabled={rolePending}>
                {roleIcons[r]} {roleNames[r]} qilish
              </button>
            </form>
          ))}

        {(member.tg || member.mfa) && (
          <form action={clearSecond}>
            <input type="hidden" name="user" value={member.user_id} />
            <input type="hidden" name="kind" value={member.tg ? "tg" : "mfa"} />
            <button className={danger} disabled={secondPending}>
              {member.tg ? "Telegramni uzish" : "Ilova kodini o‘chirish"}
            </button>
          </form>
        )}

        <form
          action={remove}
          onSubmit={(e) => {
            if (!confirm(`${member.email} panelga kira olmaydigan bo‘ladi. Ro‘yxatdan chiqarilsinmi?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="user" value={member.user_id} />
          <button className={danger} disabled={removePending}>
            Ro‘yxatdan chiqarish
          </button>
        </form>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-700 sm:text-right">{error}</p>}
    </div>
  );
}
