/** Replaces {name} placeholders in a dictionary string: fill("{n}-dars", { n: 2 }) → "2-dars". */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
