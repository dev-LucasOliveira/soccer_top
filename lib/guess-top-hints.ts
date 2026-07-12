import { parseTeams } from "@/lib/filters";
import type { SessionFilters, TeamEntry } from "@/lib/types";

export type SlotHint = {
  team: string;
  from: number;
  to: number;
  label: string;
};

function formatHintLabel(team: string, from: number, to: number): string {
  return `${team} (${from}–${to})`;
}

function stintDuration(stint: TeamEntry): number {
  return stint.to - stint.from;
}

function pickLongestStint(stints: TeamEntry[]): TeamEntry {
  return [...stints].sort((a, b) => {
    const durationDiff = stintDuration(b) - stintDuration(a);
    if (durationDiff !== 0) return durationDiff;
    return a.name.localeCompare(b.name, "pt-BR");
  })[0]!;
}

function pickThemedStint(
  stints: TeamEntry[],
  filterTeams: string[]
): TeamEntry | null {
  const normalized = filterTeams.map((team) => team.toLowerCase());
  const matches = stints.filter((stint) =>
    normalized.some(
      (filterTeam) =>
        stint.name.toLowerCase() === filterTeam ||
        stint.name.toLowerCase().includes(filterTeam)
    )
  );

  if (matches.length === 0) return null;
  return pickLongestStint(matches);
}

export function pickSlotHint(
  teamsRaw: string,
  careerStart: number,
  careerEnd: number,
  searchFilters?: SessionFilters
): SlotHint {
  const stints = parseTeams(teamsRaw);

  if (stints.length > 0) {
    const filterTeams = searchFilters?.teams;
    const themed =
      filterTeams && filterTeams.length > 0
        ? pickThemedStint(stints, filterTeams)
        : null;
    const chosen = themed ?? pickLongestStint(stints);

    return {
      team: chosen.name,
      from: chosen.from,
      to: chosen.to,
      label: formatHintLabel(chosen.name, chosen.from, chosen.to),
    };
  }

  return {
    team: "Carreira",
    from: careerStart,
    to: careerEnd,
    label: formatHintLabel("Carreira", careerStart, careerEnd),
  };
}

export function shouldShowMetaHint(searchFilters?: SessionFilters): boolean {
  if (!searchFilters) return true;

  const hasPosition = Boolean(searchFilters.positions?.length);
  const hasNationality = Boolean(searchFilters.nationalities?.length);

  return !(hasPosition && hasNationality);
}

export function countHintCollisions(
  hints: SlotHint[],
  threshold = 3
): Map<string, string[]> {
  const byLabel = new Map<string, string[]>();

  for (const hint of hints) {
    const entries = byLabel.get(hint.label) ?? [];
    entries.push(hint.team);
    byLabel.set(hint.label, entries);
  }

  const collisions = new Map<string, string[]>();
  for (const [label, teams] of byLabel) {
    if (teams.length > threshold) {
      collisions.set(label, teams);
    }
  }

  return collisions;
}
