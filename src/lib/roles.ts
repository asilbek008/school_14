// Staff roles in the admin panel (owner's request). Shared by the server check (requireAdmin) and the menu.

export type StaffRole = "admin" | "editor";

/**
 * What an editor may open: content only and their own 2FA page. Everything else — messages, applications, the
 * trust box, staff, timetable, logs, settings, backups, the team — is for admins (RLS enforces it too).
 */
const editorPaths = ["/admin/news", "/admin/events", "/admin/gallery", "/admin/achievements", "/admin/programs", "/admin/tests", "/admin/library", "/admin/security"];

export const editorMay = (path: string) => path === "/admin" || editorPaths.some((p) => path === p || path.startsWith(`${p}/`));
