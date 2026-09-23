import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import EventForm from "../EventForm";

export const metadata: Metadata = { title: "Yangi tadbir" };

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="Yangi tadbir" back="/admin/events" />
      <EventForm />
    </>
  );
}
