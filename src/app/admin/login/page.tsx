import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  // requireAdmin() sends signed-in users who are not in public.admins here with ?error=forbidden.
  // Signing in with another account replaces their session.
  const notice =
    error === "forbidden" ? "Bu hisobda admin huquqi yo‘q. Boshqa hisob bilan kiring yoki administratorga murojaat qiling." : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-navy bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(44_92_224/0.35),transparent)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-navy text-lg font-extrabold text-white shadow-[inset_0_-4px_0_var(--color-gold)]">14</span>
          <h1 className="mt-3 text-xl font-bold">Admin panel</h1>
          <p className="text-sm text-slate-500">14-maktab veb-sayti</p>
        </div>
        <LoginForm notice={notice} />
      </div>
    </main>
  );
}
