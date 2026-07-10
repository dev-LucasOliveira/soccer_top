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
