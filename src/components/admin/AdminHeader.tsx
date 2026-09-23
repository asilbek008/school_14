import Link from "next/link";

export default function AdminHeader({
  title,
  action,
  back,
}: {
  title: string;
  action?: { href: string; label: string };
  back?: string;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back} className="text-sm text-blue-700 hover:underline">
          ← Orqaga
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action && (
          <Link href={action.href} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
