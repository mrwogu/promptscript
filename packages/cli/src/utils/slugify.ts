/**
 * Convert a string to a filesystem-safe slug.
 *
 * Lowercases, replaces non-alphanumeric characters with hyphens,
 * deduplicates consecutive hyphens, and trims hyphens from edges.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
