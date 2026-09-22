/**
 * Extracts entity keys (e.g. WRK-101, TCK-202, CORE-50) from commit messages or PR titles.
 * Pattern: uppercase 2-6 chars prefix followed by a dash and digits.
 */
export function parseEntityKeys(text: string): string[] {
  if (!text) return [];
  const regex = /\b([A-Z]{2,10}-\d{1,6})\b/g;
  const matches = text.match(regex);
  if (!matches) return [];
  // Return unique keys preserving order
  return Array.from(new Set(matches));
}
