export default function Status({ published }: { published: boolean }) {
  return published ? (
    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Saytda</span>
  ) : (
    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Yashirin</span>
  );
}
