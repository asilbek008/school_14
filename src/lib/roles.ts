// Staff roles in the admin panel (owner's request). Shared by the server check (requireAdmin) and the menu.

export type StaffRole = "admin" | "editor" | "teacher";

export const roleNames: Record<StaffRole, string> = { admin: "Admin", editor: "Muharrir", teacher: "O‘qituvchi" };
export const roleIcons: Record<StaffRole, string> = { admin: "👑", editor: "✏️", teacher: "🎓" };

/**
 * What an editor may open: content only and their own 2FA page. Everything else — messages, applications, the
 * trust box, staff, timetable, logs, settings, backups, the team — is for admins (RLS enforces it too).
 */
const editorPaths = ["/admin/news", "/admin/events", "/admin/gallery", "/admin/achievements", "/admin/programs", "/admin/tests", "/admin/library", "/admin/security"];

/** A teacher only works on the learning part: tests, the question bank, its short lessons and their own 2FA. */
const teacherPaths = ["/admin/tests", "/admin/security"];

const listFor: Record<StaffRole, string[] | null> = { admin: null, editor: editorPaths, teacher: teacherPaths };

/** May this role open that admin path? The home page is open to everyone who may sign in. */
export function mayOpen(role: StaffRole, path: string): boolean {
  const allowed = listFor[role];
  if (!allowed) return true;
  return path === "/admin" || allowed.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Kept for the editor's own checks; `mayOpen` is the general form. */
export const editorMay = (path: string) => mayOpen("editor", path);
