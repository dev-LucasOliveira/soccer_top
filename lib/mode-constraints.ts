import { MIN_DUELO_PLAYERS, MAX_DUELO_PLAYERS } from "@/lib/duelo-constants";
import { MIN_IMPOSTOR_PLAYERS } from "@/lib/impostor-constants";
import { MIN_LSMP_PLAYERS, MAX_LSMP_PLAYERS } from "@/lib/lista-secreta-mp-constants";
import type { PlayableGameMode } from "@/lib/types";

export const PLAYABLE_GAME_MODES: PlayableGameMode[] = [
  "ranking",
  "impostor",
  "duelo",
  "lista-secreta-mp",
];

export function isPlayableGameMode(mode: string): mode is PlayableGameMode {
  return PLAYABLE_GAME_MODES.includes(mode as PlayableGameMode);
}

export function isModeAvailableForPlayerCount(
  mode: PlayableGameMode,
  count: number
): boolean {
  switch (mode) {
    case "ranking":
      return count >= 2;
    case "impostor":
      return count >= MIN_IMPOSTOR_PLAYERS;
    case "duelo":
      return count === MIN_DUELO_PLAYERS;
    case "lista-secreta-mp":
      return count === MIN_LSMP_PLAYERS;
    default:
      return false;
  }
}

export function getModeDisabledReason(
  mode: PlayableGameMode,
  count: number
): string | null {
  if (isModeAvailableForPlayerCount(mode, count)) return null;

  switch (mode) {
    case "ranking":
      return `Precisa de pelo menos 2 jogadores (sala tem ${count})`;
    case "impostor":
      return `Precisa de pelo menos ${MIN_IMPOSTOR_PLAYERS} jogadores (sala tem ${count})`;
    case "duelo":
      return `Precisa de exatamente 2 jogadores (sala tem ${count})`;
    case "lista-secreta-mp":
      return `Precisa de exatamente 2 jogadores (sala tem ${count})`;
  }
}

export function getSessionTitleForMode(
  code: string,
  mode: PlayableGameMode
): string {
  switch (mode) {
    case "impostor":
      return `Impostor ${code}`;
    case "duelo":
      return `Duelo ${code}`;
    case "lista-secreta-mp":
      return `Lista Secreta ${code}`;
    default:
      return `Sala ${code}`;
  }
}

export function canJoinAsPlayer(
  gameMode: string,
  playerCount: number
): { ok: boolean; error?: string } {
  if (gameMode === "lobby" || gameMode === "ranking" || gameMode === "impostor") {
    return { ok: true };
  }

  if (gameMode === "duelo" && playerCount >= MAX_DUELO_PLAYERS) {
    return {
      ok: false,
      error: "Sala cheia — o duelo aceita apenas 2 jogadores",
    };
  }

  if (gameMode === "lista-secreta-mp" && playerCount >= MAX_LSMP_PLAYERS) {
    return {
      ok: false,
      error: "Sala cheia — Lista Secreta 1v1 aceita apenas 2 jogadores",
    };
  }

  return { ok: true };
}
