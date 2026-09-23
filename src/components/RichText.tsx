// Renders admin-entered plain text: blank lines separate paragraphs, single newlines are kept.
// Deliberately not HTML, so content from the database can't inject markup.
export default function RichText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed text-slate-700">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
