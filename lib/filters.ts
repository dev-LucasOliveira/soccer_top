import type { SessionFilters, TeamEntry, Position } from "./types";

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
    if (!filterTeams.some((t) => teamNames.includes(t))) {
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
