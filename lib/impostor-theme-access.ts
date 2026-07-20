import { getImpostorTheme } from "@/lib/impostor-themes";

export function getRoundImpostorThemeId(filters: string): string | null {
  try {
    const parsed = JSON.parse(filters) as { impostorThemeId?: string };
    return parsed.impostorThemeId ?? null;
  } catch {
    return null;
  }
}

export function buildRoundImpostorFilters(themeId: string): string {
  return JSON.stringify({ impostorThemeId: themeId });
}

export function getRoundImpostorThemeTitle(filters: string): string | null {
  const themeId = getRoundImpostorThemeId(filters);
  if (!themeId) return null;
  return getImpostorTheme(themeId)?.title ?? null;
}

export function isSessionImpostor(
  gameMode: string,
  impostorParticipantId: string | null | undefined,
  viewerParticipantId: string | null | undefined
): boolean {
  return (
    gameMode === "impostor" &&
    impostorParticipantId != null &&
    viewerParticipantId != null &&
    impostorParticipantId === viewerParticipantId
  );
}

export function canImpostorSeeRoundTheme(
  isImpostor: boolean,
  roundStatus: string
): boolean {
  return !isImpostor || roundStatus === "completed";
}

export function maskThemeTitleForViewer(
  themeTitle: string | null | undefined,
  isImpostor: boolean,
  roundStatus: string
): string | null {
  if (!themeTitle) return null;
  if (canImpostorSeeRoundTheme(isImpostor, roundStatus)) return themeTitle;
  return null;
}

export const IMPOSTOR_SESSION_DISPLAY_TITLE = "Impostor";

export function maskImpostorRoundTitleForList(round: {
  number: number;
  title: string;
  status: string;
}): string {
  if (round.status === "completed") {
    return round.title;
  }
  return `Rodada ${round.number}`;
}

export function maskImpostorRoundTitleForViewer(
  round: { number: number; title: string; status: string },
  isImpostor: boolean
): string {
  if (canImpostorSeeRoundTheme(isImpostor, round.status)) {
    return round.title;
  }
  return `Rodada ${round.number}`;
}

/** @deprecated Use maskImpostorRoundTitleForViewer or maskImpostorRoundTitleForList */
export function maskImpostorRoundTitle(
  round: { number: number; title: string; status: string },
  isImpostor: boolean
): string {
  return maskImpostorRoundTitleForViewer(round, isImpostor);
}
