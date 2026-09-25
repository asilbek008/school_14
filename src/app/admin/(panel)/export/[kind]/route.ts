import writeExcelFile, { type SheetData } from "write-excel-file/node";
import { requireAdmin } from "@/lib/admin";

// Admin-only Excel downloads of what people sent through the site. The trust box is left out on
// purpose: those messages are confidential and stay in the panel.

const statusLabels: Record<string, string> = { new: "Yangi", contacted: "Bog‘lanildi", accepted: "Qabul qilindi", declined: "Rad etildi" };
const topicLabels: Record<string, string> = { savol: "Savol", taklif: "Taklif", murojaat: "Murojaat", boshqa: "Boshqa" };

/** "2026-09-25 10:00", Tashkent time: sorts correctly and reads the same in any spreadsheet. */
const stamp = (iso: string) => new Date(Date.parse(iso) + 5 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");
/** "14.05.2018" from a plain date. */
const day = (iso: string) => iso.split("-").reverse().join(".");

const header = (titles: string[]) => titles.map((value) => ({ value, fontWeight: "bold" as const, backgroundColor: "#E8EEFB" }));

export async function GET(_request: Request, { params }: RouteContext<"/admin/export/[kind]">) {
  const { supabase } = await requireAdmin();
  const { kind } = await params;
  let sheet: string;
  let data: SheetData;
  let widths: number[];

  if (kind === "applications") {
    const { data: rows, error } = await supabase
      .from("admission_applications")
      .select("created_at, status, grade, child_name, child_birth_date, parent_name, phone, address, previous_school, note, admin_note")
      .order("created_at", { ascending: false });
    if (error) return new Response("Ma’lumotni o‘qib bo‘lmadi", { status: 500 });
    sheet = "Qabul arizalari";
    widths = [17, 14, 7, 28, 13, 28, 18, 32, 28, 40, 32];
    data = [
      header(["Sana", "Holat", "Sinf", "Bola F.I.Sh.", "Tug‘ilgan", "Ota-ona", "Telefon", "Manzil", "Oldingi maktab", "Izoh", "Maktab izohi"]),
      ...(rows ?? []).map((r) => [
        stamp(r.created_at),
        statusLabels[r.status] ?? r.status,
        r.grade,
        r.child_name,
        day(r.child_birth_date),
        r.parent_name,
        r.phone,
        r.address,
        r.previous_school,
        r.note,
        r.admin_note,
      ]),
    ];
  } else if (kind === "messages") {
    const { data: rows, error } = await supabase
      .from("contact_messages")
      .select("created_at, topic, name, phone, email, message, is_read")
      .order("created_at", { ascending: false });
    if (error) return new Response("Ma’lumotni o‘qib bo‘lmadi", { status: 500 });
    sheet = "Xabarlar";
    widths = [17, 11, 26, 18, 26, 60, 10];
    data = [
      header(["Sana", "Mavzu", "Ism", "Telefon", "Email", "Xabar", "O‘qilgan"]),
      ...(rows ?? []).map((r) => [
        stamp(r.created_at),
        topicLabels[r.topic ?? ""] ?? r.topic,
        r.name,
        r.phone,
        r.email,
        r.message,
        r.is_read ? "ha" : "yo‘q",
      ]),
    ];
  } else if (kind === "test-template") {
    // A blank question sheet for the tests import, with one sample row (skipped on import: it starts with "Namuna:").
    sheet = "Savollar";
    widths = [60, 22, 22, 22, 22, 9, 45];
    data = [
      header(["Savol", "A", "B", "C", "D", "Javob", "Izoh"]),
      ["Namuna: 2 + 2 nechaga teng? (bu qator yuklanmaydi — o‘chirib, o‘z savollaringizni yozing)", "3", "4", "5", "22", "B", "2 ga 2 ni qo‘shsak, 4 bo‘ladi."],
    ];
  } else {
    return new Response("Topilmadi", { status: 404 });
  }

  const buffer = await writeExcelFile(data, { sheet, columns: widths.map((width) => ({ width })), stickyRowsCount: 1 }).toBuffer();
  const name =
    kind === "test-template" ? "test-namuna.xlsx" : `${kind === "applications" ? "qabul-arizalari" : "xabarlar"}-${stamp(new Date().toISOString()).slice(0, 10)}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
