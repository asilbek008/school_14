import type { Metadata } from "next";
import MfaForm from "./MfaForm";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Tasdiqlash kodi" };

/** The second step of signing in, for staff who turned on an authenticator app. */
export default function MfaPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-navy bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(44_92_224/0.35),transparent)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand text-2xl text-white">🔐</span>
          <h1 className="mt-3 text-xl font-bold">Tasdiqlash kodi</h1>
          <p className="text-sm text-slate-500">Telefoningizdagi autentifikator ilovasidagi (Google Authenticator va h.k.) 6 xonali kodni kiriting.</p>
        </div>
        <MfaForm />
        <form action={signOut} className="mt-4 text-center">
          <button className="text-sm text-slate-500 hover:text-slate-800 hover:underline">Boshqa hisob bilan kirish</button>
        </form>
      </div>
    </main>
  );
}
