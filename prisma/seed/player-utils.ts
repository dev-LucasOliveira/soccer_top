import { normalizeSearch } from "../../lib/normalize";

export function playerKey(name: string): string {
  return normalizeSearch(name);
}

export function parseEra(era: string): { careerStart: number; careerEnd: number } {
  const years = era.match(/\d{4}/g)?.map(Number) ?? [];
  if (years.length === 0) {
    return { careerStart: 1980, careerEnd: 2000 };
  }
  return {
    careerStart: Math.min(...years),
    careerEnd: Math.max(...years),
  };
}
