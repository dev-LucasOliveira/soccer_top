export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(name: string, query: string): boolean {
  if (!query) return true;
  return normalizeSearch(name).includes(normalizeSearch(query));
}

/** Lower score = better match (for sorting autocomplete results). */
export function searchMatchRank(name: string, query: string): number {
  const n = normalizeSearch(name);
  const q = normalizeSearch(query);
  if (!q) return 0;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  const parts = n.split(/\s+/);
  if (parts.some((part) => part === q)) return 2;
  if (parts.some((part) => part.startsWith(q))) return 3;
  if (n.includes(q)) return 4;
  return 5;
}
