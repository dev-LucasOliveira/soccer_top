import type { SessionFilters, TeamEntry, Position } from "./types";
import { NATIONALITIES, POSITIONS } from "./constants";

type PlayerForFilter = {
  primaryPosition: string;
  nationality: string;
  teams: string;
  careerStart: number;
  careerEnd: number;
};

export function parseFilters(raw: string): SessionFilters {
  try {
    return JSON.parse(raw) as SessionFilters;
  } catch {
    return {};
  }
}

export function parseTeams(raw: string): TeamEntry[] {
  try {
    return JSON.parse(raw) as TeamEntry[];
  } catch {
    return [];
  }
}

export function playerMatchesFilters(
  player: PlayerForFilter,
  filters: SessionFilters
): boolean {
  if (
    filters.positions?.length &&
    !filters.positions.includes(player.primaryPosition as Position)
  ) {
    return false;
  }

  if (
    filters.nationalities?.length &&
    !filters.nationalities.includes(player.nationality)
  ) {
    return false;
  }

  if (filters.teams?.length) {
    const teams = parseTeams(player.teams);
    const teamNames = teams.map((t) => t.name.toLowerCase());
    const filterTeams = filters.teams.map((t) => t.toLowerCase());
    if (
      !filterTeams.some((filterTeam) =>
        teamNames.some(
          (name) => name === filterTeam || name.includes(filterTeam)
        )
      )
    ) {
      return false;
    }
  }

  if (filters.eraStart !== undefined || filters.eraEnd !== undefined) {
    const eraStart = filters.eraStart ?? 1900;
    const eraEnd = filters.eraEnd ?? new Date().getFullYear();
    const overlaps =
      player.careerStart <= eraEnd && player.careerEnd >= eraStart;
    if (!overlaps) return false;
  }

  return true;
}

export function filterPlayers<T extends PlayerForFilter>(
  players: T[],
  filters: SessionFilters
): T[] {
  return players.filter((p) => playerMatchesFilters(p, filters));
}

export function hasActiveFilters(filters?: SessionFilters): boolean {
  if (!filters) return false;
  return Boolean(
    filters.positions?.length ||
      filters.nationalities?.length ||
      filters.teams?.length ||
      filters.eraStart !== undefined ||
      filters.eraEnd !== undefined
  );
}

export function filtersToSearchParams(
  filters: SessionFilters,
  base?: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(base);

  if (filters.positions?.length) {
    params.set("positions", filters.positions.join(","));
  }
  if (filters.nationalities?.length) {
    params.set("nationalities", filters.nationalities.join(","));
  }
  if (filters.teams?.length) {
    params.set("teams", filters.teams.join(","));
  }
  if (filters.eraStart !== undefined) {
    params.set("eraStart", String(filters.eraStart));
  }
  if (filters.eraEnd !== undefined) {
    params.set("eraEnd", String(filters.eraEnd));
  }

  return params;
}

export function formatFiltersSummary(filters?: SessionFilters): string | null {
  if (!hasActiveFilters(filters) || !filters) return null;

  const parts: string[] = [];

  if (filters.positions?.length) {
    const labels = filters.positions.map(
      (pos) => POSITIONS.find((p) => p.value === pos)?.label ?? pos
    );
    parts.push(...labels);
  }

  if (filters.nationalities?.length) {
    const labels = filters.nationalities.map(
      (code) => NATIONALITIES.find((n) => n.value === code)?.label ?? code
    );
    parts.push(...labels);
  }

  if (filters.eraStart !== undefined || filters.eraEnd !== undefined) {
    const start = filters.eraStart ?? "...";
    const end = filters.eraEnd ?? "...";
    parts.push(`${start}–${end}`);
  }

  return parts.length ? parts.join(", ") : null;
}

export function parseSoloFilters(value: unknown): SessionFilters | undefined {
  if (!value || typeof value !== "object") return undefined;

  const raw = value as SessionFilters;
  const filters: SessionFilters = {};

  if (Array.isArray(raw.positions) && raw.positions.length) {
    filters.positions = raw.positions.filter(
      (p): p is Position => typeof p === "string"
    );
  }
  if (Array.isArray(raw.nationalities) && raw.nationalities.length) {
    filters.nationalities = raw.nationalities.filter(
      (n): n is string => typeof n === "string"
    );
  }
  if (Array.isArray(raw.teams) && raw.teams.length) {
    filters.teams = raw.teams.filter((t): t is string => typeof t === "string");
  }
  if (typeof raw.eraStart === "number") {
    filters.eraStart = raw.eraStart;
  }
  if (typeof raw.eraEnd === "number") {
    filters.eraEnd = raw.eraEnd;
  }

  return hasActiveFilters(filters) ? filters : undefined;
}
