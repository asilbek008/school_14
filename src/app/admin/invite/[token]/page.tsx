import type { Metadata } from "next";
import Crest from "@/components/admin/Crest";
import InviteSetup from "./InviteSetup";

export const metadata: Metadata = { title: "Panelga kirish", robots: { index: false } };

/** The invited colleague's page: they set their own password and the account is made for them. */
export default async function InvitePage({ params }: PageProps<"/admin/invite/[token]">) {
  const { token } = await params;

  return (
    <main className="grid min-h-screen place-items-center bg-navy bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(44_92_224/0.35),transparent)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-8">
        <div className="mb-6 text-center">
          <Crest className="mx-auto size-16" />
          <h1 className="mt-3 text-xl font-bold">Admin panelga kirish</h1>
          <p className="text-sm text-slate-500">O‘zingizga parol o‘ylab toping — uni faqat siz bilasiz.</p>
        </div>
        <InviteSetup token={token} />
      </div>
    </main>
  );
}
