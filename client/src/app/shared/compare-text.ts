/** Case-insensitive, locale-aware comparison for sorting by name. */
export function compareText(a: string | undefined, b: string | undefined): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}
