import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import {
  GUESS_TOP_CHALLENGES,
  type GuessTopChallengeDefinition,
  type GuessTopChallengeResolved,
} from "@/lib/guess-top-challenges";
import { pickSlotHint } from "@/lib/guess-top-hints";
import { buildHintLadder } from "@/lib/um-so-hints";
import type { UmSoHintStep, UmSoPublicRound } from "@/lib/um-so-types";
import type { UmSoPlayerForHints } from "@/lib/um-so-hints";

export type UmSoPoolPlayer = {
  playerId: string;
  playerName: string;
  nationality: string;
  position: string;
  teams: string;
  careerStart: number;
  careerEnd: number;
  hint: ReturnType<typeof pickSlotHint>;
};

export type UmSoChallengeResolved = {
  id: string;
  title: string;
  description: string;
  searchFilters?: import("@/lib/types").SessionFilters;
  umSoHintLadder?: import("@/lib/um-so-types").UmSoHintKind[];
  pool: UmSoPoolPlayer[];
};

const resolvedCache = new Map<string, UmSoChallengeResolved>();

function challengeCacheKey(definition: GuessTopChallengeDefinition): string {
  const names = [...definition.pool].sort().join("|");
  const ladder = definition.umSoHintLadder?.join(",") ?? "auto";
  return `um-so:${definition.id}:${names}:${ladder}`;
}

export async function resolveUmSoChallenge(
  definition: GuessTopChallengeDefinition
): Promise<UmSoChallengeResolved> {
  const cacheKey = challengeCacheKey(definition);
  const cached = resolvedCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      searchFilters: definition.searchFilters,
      title: definition.title,
      description: definition.description,
    };
  }

  const uniqueNames = [...new Set(definition.pool)];
  const players = await prisma.player.findMany({
    where: { name: { in: uniqueNames } },
  });

  const byName = new Map(players.map((player) => [player.name, player]));

  const pool: UmSoPoolPlayer[] = uniqueNames.map((playerName) => {
    const player = byName.get(playerName);
    if (!player) {
      throw new Error(
        `Jogador não encontrado para o desafio ${definition.id}: ${playerName}`
      );
    }

    return {
      playerId: player.id,
      playerName: player.name,
      nationality: player.nationality,
      position: player.primaryPosition,
      teams: player.teams,
      careerStart: player.careerStart,
      careerEnd: player.careerEnd,
      hint: pickSlotHint(
        player.teams,
        player.careerStart,
        player.careerEnd,
        definition.searchFilters
      ),
    };
  });

  const resolved: UmSoChallengeResolved = {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    searchFilters: definition.searchFilters,
    pool,
    umSoHintLadder: definition.umSoHintLadder,
  };

  resolvedCache.set(cacheKey, resolved);
  return resolved;
}

export async function getUmSoChallengeById(
  id: string
): Promise<UmSoChallengeResolved | null> {
  const definition = GUESS_TOP_CHALLENGES.find((c) => c.id === id);
  if (!definition) return null;
  return resolveUmSoChallenge(definition);
}

export function drawSecretPlayerId(challenge: UmSoChallengeResolved): string {
  const index = randomInt(challenge.pool.length);
  return challenge.pool[index]!.playerId;
}

export function pickRandomChallengeId(): string {
  const index = randomInt(GUESS_TOP_CHALLENGES.length);
  return GUESS_TOP_CHALLENGES[index]!.id;
}

export function playerToHintSource(player: UmSoPoolPlayer): UmSoPlayerForHints {
  return {
    nationality: player.nationality,
    primaryPosition: player.position,
    teams: player.teams,
    careerStart: player.careerStart,
    careerEnd: player.careerEnd,
  };
}

export function buildPlayerHintLadder(
  player: UmSoPoolPlayer,
  challenge: UmSoChallengeResolved
): UmSoHintStep[] {
  return buildHintLadder(playerToHintSource(player), challenge);
}

export function toPublicRound(
  challenge: UmSoChallengeResolved,
  secretPlayerId: string,
  hintsRevealed: number,
  ladder?: UmSoHintStep[]
): UmSoPublicRound {
  const player = challenge.pool.find((entry) => entry.playerId === secretPlayerId);
  if (!player) {
    throw new Error(
      `Jogador secreto não encontrado no pool ${challenge.id}: ${secretPlayerId}`
    );
  }

  const hintLadder = ladder ?? buildPlayerHintLadder(player, challenge);

  return {
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    searchFilters: challenge.searchFilters,
    hintsRevealed: hintLadder.slice(0, hintsRevealed),
    totalHints: hintLadder.length,
  };
}

export function checkSecretPick(
  challenge: UmSoChallengeResolved,
  secretPlayerId: string,
  playerId: string
): boolean {
  return secretPlayerId === playerId;
}

export function getSecretPlayer(
  challenge: UmSoChallengeResolved,
  secretPlayerId: string
): UmSoPoolPlayer | null {
  return challenge.pool.find((entry) => entry.playerId === secretPlayerId) ?? null;
}
