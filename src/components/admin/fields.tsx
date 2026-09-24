// Server-renderable form fields shared by admin forms.

export const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

const languages = [
  { code: "uz", label: "O‘zbekcha", required: true },
  { code: "ru", label: "Русский", required: false },
  { code: "en", label: "English", required: false },
] as const;

type Row = Record<string, unknown> | null | undefined;

/** Three inputs (uz/ru/en) for one translatable column, e.g. name="title" → title_uz, title_ru, title_en. */
export function TranslatedField({
  name,
  label,
  row,
  multiline = false,
  uzRequired = true,
  suggestions,
}: {
  name: string;
  label: string;
  row?: Row;
  multiline?: boolean;
  uzRequired?: boolean;
  /** Values offered while typing (a datalist), per language; any other text is still allowed. */
  suggestions?: Record<string, string[]>;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div className={`mt-2 grid gap-3 ${multiline ? "" : "md:grid-cols-3"}`}>
        {languages.map(({ code, label: langLabel, required }) => {
          const field = `${name}_${code}`;
          const value = (row?.[field] as string | null | undefined) ?? "";
          const isRequired = required && uzRequired;
          return (
            <label key={code} className="block text-xs font-medium text-slate-500">
              {langLabel}
              {isRequired ? " *" : " (ixtiyoriy)"}
              {multiline ? (
                <textarea name={field} defaultValue={value} required={isRequired} rows={8} className={inputClass} />
              ) : (
                <>
                  <input name={field} defaultValue={value} required={isRequired} list={suggestions?.[code] && `${field}-list`} className={inputClass} />
                  {suggestions?.[code] && (
                    <datalist id={`${field}-list`}>
                      {suggestions[code].map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
            </label>
          );
        })}
      </div>
      {multiline && (
        <p className="mt-1 text-xs text-slate-500">Paragraflarni bo‘sh qator bilan ajrating.</p>
      )}
    </fieldset>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function PublishedCheckbox({ checked, label = "Saytda ko‘rsatish" }: { checked: boolean; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
      <input type="checkbox" name="is_published" defaultChecked={checked} className="size-4" />
      {label}
    </label>
  );
}

/** A titled block of the form, divided from the one above. */
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
