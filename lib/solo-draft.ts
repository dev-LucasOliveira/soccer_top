import { validateRoundConfig } from "@/lib/round-config";
import { normalizeListMessage } from "@/lib/ranking-message";
import { parseSoloFilters } from "@/lib/filters";
import type { SessionFilters, SoloDraft, TopItem, TopPick } from "@/lib/types";

export const SOLO_DRAFT_STORAGE_KEY = "solo-draft";

export function topItemsToPicks(items: TopItem[]): TopPick[] {
  return items.map((item, index) => ({
    rank: index + 1,
    playerId: item.playerId,
    playerName: item.playerName,
    position: item.position,
    nationality: item.nationality,
  }));
}

export function picksToTopItems(
  picks: TopPick[],
  fallback?: TopItem[]
): TopItem[] {
  const fallbackById = new Map(
    (fallback ?? []).map((item) => [item.playerId, item])
  );

  return [...picks]
    .sort((a, b) => a.rank - b.rank)
    .map((pick) => {
      const existing = fallbackById.get(pick.playerId);
      return {
        playerId: pick.playerId,
        playerName: pick.playerName,
        position: pick.position ?? existing?.position ?? "",
        nationality: pick.nationality ?? existing?.nationality ?? "",
      };
    });
}

function filtersKey(filters?: SessionFilters): string {
  return JSON.stringify(filters ?? {});
}

export function soloSetupMatches(a: SoloDraft, b: SoloDraft): boolean {
  return (
    a.authorName.trim() === b.authorName.trim() &&
    a.title.trim() === b.title.trim() &&
    a.topN === b.topN &&
    filtersKey(a.filters) === filtersKey(b.filters)
  );
}

export function validateSoloSetup(
  draft: Pick<SoloDraft, "authorName" | "title" | "topN">
): string | null {
  if (!draft.authorName.trim()) {
    return "Nome é obrigatório";
  }

  return validateRoundConfig(
    { title: draft.title, topN: draft.topN },
    "Ranking"
  );
}

export function isSoloSetupComplete(
  draft: SoloDraft | null
): draft is SoloDraft {
  if (!draft) return false;
  return validateSoloSetup(draft) === null;
}

export function isSoloDraftComplete(
  draft: SoloDraft | null
): draft is SoloDraft {
  if (!isSoloSetupComplete(draft)) return false;
  return draft.picks.length === draft.topN;
}

export function loadSoloDraft(): SoloDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(SOLO_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SoloDraft>;
    if (
      typeof parsed.authorName !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.topN !== "number" ||
      !Array.isArray(parsed.picks)
    ) {
      return null;
    }

    const draft: SoloDraft = {
      authorName: parsed.authorName,
      title: parsed.title,
      topN: parsed.topN,
      picks: parsed.picks
        .filter(
          (pick): pick is TopPick =>
            typeof pick?.rank === "number" &&
            typeof pick?.playerId === "string" &&
            typeof pick?.playerName === "string"
        )
        .map((pick) => ({
          rank: pick.rank,
          playerId: pick.playerId,
          playerName: pick.playerName,
          position:
            typeof pick.position === "string" ? pick.position : undefined,
          nationality:
            typeof pick.nationality === "string" ? pick.nationality : undefined,
        })),
      message: parsed.message,
      filters: parseSoloFilters(parsed.filters),
    };

    return validateSoloSetup(draft) === null ? draft : null;
  } catch {
    return null;
  }
}

export function saveSoloDraft(draft: SoloDraft): void {
  if (typeof window === "undefined") return;

  const setupError = validateSoloSetup(draft);
  if (setupError) {
    throw new Error(setupError);
  }

  const message = draft.message
    ? normalizeListMessage(draft.message) ?? undefined
    : undefined;

  sessionStorage.setItem(
    SOLO_DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...draft,
      authorName: draft.authorName.trim(),
      title: draft.title.trim(),
      message,
      filters: draft.filters,
    })
  );
}

export function clearSoloDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SOLO_DRAFT_STORAGE_KEY);
}

export function createEmptySoloDraft(
  partial: Pick<SoloDraft, "authorName" | "title" | "topN"> & {
    filters?: SessionFilters;
  }
): SoloDraft {
  return {
    authorName: partial.authorName.trim(),
    title: partial.title.trim(),
    topN: partial.topN,
    picks: [],
    message: undefined,
    filters: partial.filters,
  };
}
