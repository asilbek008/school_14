/** Replaces {name} placeholders in a dictionary string: fill("{n}-dars", { n: 2 }) → "2-dars". */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Picks a plural form ({ one, few, many, other }) for `n` by the language's rules, then fills {n}. */
export function plural(forms: Record<string, string>, n: number, lang: string): string {
  const form = forms[new Intl.PluralRules(lang).select(n)] ?? forms.other;
  return fill(form, { n });
}
