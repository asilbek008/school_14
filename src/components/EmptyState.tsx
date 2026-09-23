export default function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-slate-500">
      {children}
    </p>
  );
}
