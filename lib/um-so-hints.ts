import { parseTeams } from "@/lib/filters";
import {
  isoToContinent,
  isoToLabel,
  nationalitiesShareContinent,
} from "@/lib/nationality-codes";
import type { GuessTopChallengeResolved } from "@/lib/guess-top-challenges";
import type { SessionFilters, TeamEntry } from "@/lib/types";
import type { UmSoHintKind, UmSoHintStep } from "@/lib/um-so-types";

export const DEFAULT_UM_SO_HINT_ORDER: UmSoHintKind[] = [
  "continent",
  "country",
  "position",
  "career",
  "primary_club",
  "primary_club_era",
  "secondary_club",
  "secondary_club_era",
];

const UM_SO_NATIONALITY_LADDER: UmSoHintKind[] = [
  "position",
  "career",
  "primary_club",
  "primary_club_era",
  "secondary_club",
  "secondary_club_era",
];

const UM_SO_POSITION_LADDER: UmSoHintKind[] = [
  "country",
  "career",
  "primary_club",
  "primary_club_era",
  "secondary_club",
  "secondary_club_era",
];

const UM_SO_CLUB_LADDER: UmSoHintKind[] = [
  "country",
  "position",
  "career",
  "primary_club_era",
  "secondary_club",
  "secondary_club_era",
];

const UM_SO_NATIONALITY_POSITION_LADDER: UmSoHintKind[] = [
  "career_start",
  "career_end",
  "primary_club",
  "primary_club_era",
  "secondary_club",
  "secondary_club_era",
];

export type UmSoPlayerForHints = {
  nationality: string;
  primaryPosition: string;
  teams: string;
  careerStart: number;
  careerEnd: number;
};

const HINT_LABELS: Record<UmSoHintKind, string> = {
  continent: "Continente",
  country: "País",
  position: "Posição",
  career: "Carreira",
  career_start: "Estreou em",
  career_end: "Encerrou em",
  primary_club: "Clube principal",
  primary_club_era: "Clube e período",
  secondary_club: "Outro clube",
  secondary_club_era: "Outro clube e período",
};

function stintDuration(stint: TeamEntry): number {
  return stint.to - stint.from;
}

function pickLongestStint(stints: TeamEntry[]): TeamEntry | null {
  if (stints.length === 0) return null;
  return [...stints].sort((a, b) => {
    const durationDiff = stintDuration(b) - stintDuration(a);
    if (durationDiff !== 0) return durationDiff;
    return a.name.localeCompare(b.name, "pt-BR");
  })[0]!;
}

function pickSecondLongestStint(stints: TeamEntry[]): TeamEntry | null {
  if (stints.length < 2) return null;
  const sorted = [...stints].sort((a, b) => {
    const durationDiff = stintDuration(b) - stintDuration(a);
    if (durationDiff !== 0) return durationDiff;
    return a.name.localeCompare(b.name, "pt-BR");
  });
  return sorted[1] ?? null;
}

function pickPrimaryStint(
  stints: TeamEntry[],
  searchFilters?: SessionFilters
): TeamEntry | null {
  if (stints.length === 0) return null;

  const filterTeams = searchFilters?.teams;
  if (filterTeams && filterTeams.length === 1) {
    const normalized = filterTeams[0]!.toLowerCase();
    const nonThemed = stints.filter(
      (stint) =>
        !stint.name.toLowerCase().includes(normalized) &&
        stint.name.toLowerCase() !== normalized
    );
    if (nonThemed.length > 0) {
      return pickLongestStint(nonThemed);
    }
  }

  return pickLongestStint(stints);
}

function formatEra(from: number, to: number): string {
  return `${from}–${to}`;
}

function formatClubEra(team: string, from: number, to: number): string {
  return `${team} (${from}–${to})`;
}

function resolveHintText(
  kind: UmSoHintKind,
  player: UmSoPlayerForHints,
  searchFilters?: SessionFilters
): string | null {
  const stints = parseTeams(player.teams);

  switch (kind) {
    case "continent":
      return isoToContinent(player.nationality);
    case "country":
      return isoToLabel(player.nationality);
    case "position":
      return player.primaryPosition;
    case "career":
      return formatEra(player.careerStart, player.careerEnd);
    case "career_start":
      return String(player.careerStart);
    case "career_end":
      return String(player.careerEnd);
    case "primary_club": {
      const stint = pickPrimaryStint(stints, searchFilters);
      return stint?.name ?? null;
    }
    case "primary_club_era": {
      const stint = pickPrimaryStint(stints, searchFilters);
      return stint
        ? formatClubEra(stint.name, stint.from, stint.to)
        : formatClubEra("Carreira", player.careerStart, player.careerEnd);
    }
    case "secondary_club": {
      const primary = pickPrimaryStint(stints, searchFilters);
      const remaining = primary
        ? stints.filter((stint) => stint.name !== primary.name)
        : stints;
      const secondary = pickLongestStint(remaining);
      return secondary?.name ?? null;
    }
    case "secondary_club_era": {
      const primary = pickPrimaryStint(stints, searchFilters);
      const remaining = primary
        ? stints.filter((stint) => stint.name !== primary.name)
        : stints;
      const secondary = pickSecondLongestStint(
        primary ? remaining : stints
      );
      return secondary
        ? formatClubEra(secondary.name, secondary.from, secondary.to)
        : null;
    }
  }
}

function poolValuesUniform<T>(
  values: T[],
  predicate: (value: T) => boolean
): boolean {
  const filtered = values.filter(predicate);
  if (filtered.length === 0) return false;
  const first = filtered[0];
  return filtered.every((value) => value === first);
}

function clubMatchesFilter(clubName: string, filterTeams: string[]): boolean {
  const normalizedClub = clubName.toLowerCase();
  return filterTeams.some(
    (team) =>
      normalizedClub === team.toLowerCase() ||
      normalizedClub.includes(team.toLowerCase())
  );
}

export function isHintRedundant(
  kind: UmSoHintKind,
  player: UmSoPlayerForHints,
  challenge: GuessTopChallengeResolved
): boolean {
  const filters = challenge.searchFilters;
  const poolNationalities = challenge.pool.map((entry) => entry.nationality);
  const poolPositions = challenge.pool.map((entry) => entry.position);

  if (kind === "continent") {
    if (filters?.nationalities?.length === 1) return true;
    if (poolValuesUniform(poolNationalities, Boolean)) {
      const continents = new Set(
        poolNationalities.map((iso) => isoToContinent(iso))
      );
      if (continents.size === 1) return true;
    }
    if (
      filters?.nationalities?.length &&
      nationalitiesShareContinent(filters.nationalities)
    ) {
      return true;
    }
  }

  if (kind === "country") {
    if (filters?.nationalities?.length === 1) return true;
    if (poolValuesUniform(poolNationalities, Boolean)) return true;
  }

  if (kind === "position") {
    if (filters?.positions?.length === 1) return true;
    if (poolValuesUniform(poolPositions, Boolean)) return true;
  }

  if (kind === "career" || kind === "career_start" || kind === "career_end") {
    const eraStart = filters?.eraStart;
    const eraEnd = filters?.eraEnd;
    if (eraStart !== undefined && eraEnd !== undefined) {
      if (eraEnd - eraStart <= 15) return true;
    }
  }

  if (kind === "primary_club" && filters?.teams?.length === 1) {
    const primaryClub = resolveHintText(kind, player, filters);
    if (primaryClub && clubMatchesFilter(primaryClub, filters.teams)) {
      return true;
    }
  }

  const text = resolveHintText(kind, player, filters);
  if (!text || text.trim() === "") return true;

  if (kind === "secondary_club" || kind === "secondary_club_era") {
    const primaryText = resolveHintText("primary_club", player, filters);
    if (primaryText && text.includes(primaryText) && kind === "secondary_club") {
      return true;
    }
  }

  return false;
}

export function isHintSemanticallyRedundant(
  kind: UmSoHintKind,
  acceptedSteps: UmSoHintStep[],
  player: UmSoPlayerForHints,
  challenge: GuessTopChallengeResolved
): boolean {
  const acceptedKinds = new Set(acceptedSteps.map((step) => step.kind));

  if (
    (kind === "career_start" || kind === "career_end") &&
    acceptedKinds.has("career")
  ) {
    return true;
  }

  if (
    kind === "career" &&
    acceptedKinds.has("career_start") &&
    acceptedKinds.has("career_end")
  ) {
    return true;
  }

  if (kind === "primary_club_era" && acceptedKinds.has("career")) {
    const text = resolveHintText(kind, player, challenge.searchFilters);
    const careerText = resolveHintText("career", player, challenge.searchFilters);
    if (
      text &&
      careerText &&
      text === formatClubEra("Carreira", player.careerStart, player.careerEnd)
    ) {
      return true;
    }
  }

  return false;
}

export function getHintOrder(
  challenge: GuessTopChallengeResolved
): UmSoHintKind[] {
  const definition = challenge as GuessTopChallengeResolved & {
    umSoHintLadder?: UmSoHintKind[];
  };

  if (definition.umSoHintLadder?.length) {
    return definition.umSoHintLadder;
  }

  const filters = challenge.searchFilters;
  if (filters?.teams?.length === 1) return UM_SO_CLUB_LADDER;
  if (
    filters?.nationalities?.length === 1 &&
    filters?.positions?.length === 1
  ) {
    return UM_SO_NATIONALITY_POSITION_LADDER;
  }
  if (filters?.nationalities?.length === 1) return UM_SO_NATIONALITY_LADDER;
  if (filters?.positions?.length === 1) return UM_SO_POSITION_LADDER;

  return DEFAULT_UM_SO_HINT_ORDER;
}

export function buildHintLadder(
  player: UmSoPlayerForHints,
  challenge: GuessTopChallengeResolved
): UmSoHintStep[] {
  const order = getHintOrder(challenge);
  const steps: UmSoHintStep[] = [];

  for (const kind of order) {
    if (isHintRedundant(kind, player, challenge)) continue;
    if (isHintSemanticallyRedundant(kind, steps, player, challenge)) continue;

    const text = resolveHintText(kind, player, challenge.searchFilters);
    if (!text) continue;

    steps.push({
      kind,
      label: HINT_LABELS[kind],
      text,
    });
  }

  return steps;
}
