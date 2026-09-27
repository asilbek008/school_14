"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { canvasToPdf } from "@/lib/certificate";
import { defaultSchoolName, drawDocument, templates, type DocTemplate } from "@/lib/docgen";

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const today = () => new Date(new Date().getTime() + 5 * 3_600_000).toISOString().slice(0, 10);

/** The values a template starts with (today's date, the remembered school name and signer). */
function presets(template: DocTemplate, remembered: Record<string, string>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of template.fields) {
    if (field.preset === "today") values[field.name] = today();
    else if (field.preset === "school") values[field.name] = remembered.school ?? defaultSchoolName;
    else if (field.preset === "director") values[field.name] = remembered.signer ?? "Maktab direktori";
  }
  return values;
}

/**
 * Pick a template, fill the fields, see the page and download it. Everything happens in the browser —
 * what is typed here is not stored anywhere (only the school name and the signer are remembered on this
 * device, so they need not be retyped).
 */
export default function DocGen() {
  const [id, setId] = useState(templates[0].id);
  const template = useMemo(() => templates.find((t) => t.id === id) ?? templates[0], [id]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Remembered bits, read after the first paint so the server and client render the same thing.
  useEffect(() => {
    const timer = setTimeout(() => {
      let remembered: Record<string, string> = {};
      try {
        remembered = JSON.parse(localStorage.getItem("docgen") ?? "{}");
      } catch {
        remembered = {};
      }
      setValues(presets(template, remembered));
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [template]);

  // Redraw the page on every change.
  useEffect(() => {
    if (!ready || !box.current) return;
    const canvas = drawDocument(template, values);
    canvas.className = "w-full rounded-lg border border-slate-200 shadow-sm";
    box.current.replaceChildren(canvas);
  }, [template, values, ready]);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const missing = template.fields.filter((f) => f.required && !values[f.name]?.trim()).map((f) => f.label);

  async function download() {
    try {
      localStorage.setItem("docgen", JSON.stringify({ school: values.school ?? "", signer: values.signer ?? "" }));
    } catch {
      // A private window: only the convenience is lost.
    }
    const blob = await canvasToPdf(drawDocument(template, values), "portrait");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}-${(values.name || values.cls || "hujjat").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setId(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${t.id === id ? "bg-blue-700 text-white" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-slate-600">{template.about}</p>
          <div className="space-y-3">
            {template.fields.map((f) => (
              <label key={f.name} className="block text-sm font-medium text-slate-700">
                {f.label}
                {f.required && <span className="text-red-600"> *</span>}
                {f.kind === "long" ? (
                  <textarea rows={5} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={input} />
                ) : (
                  <input
                    type={f.kind === "date" ? "date" : "text"}
                    value={values[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={input}
                  />
                )}
                {f.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{f.hint}</span>}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={download}
            disabled={missing.length > 0}
            className="mt-5 w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            PDF yuklab olish
          </button>
          {missing.length > 0 && <p className="mt-2 text-xs text-amber-700">To‘ldirilmagan: {missing.join(", ")}</p>}
        </div>
      </div>
      <div>
        <div ref={box} className="sticky top-24" />
        {!ready && <p className="text-sm text-slate-500">Yuklanmoqda…</p>}
      </div>
    </div>
  );
}
