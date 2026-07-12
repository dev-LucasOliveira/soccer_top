import { prisma } from "@/lib/db";
import {
  drawRoundPlayers,
  GUESS_TOP_CHALLENGES,
  GUESS_TOP_DRAW_COUNT,
  type GuessTopChallengeDefinition,
  type GuessTopChallengeResolved,
  type PoolPlayerResolved,
} from "@/lib/guess-top-challenges";
import { pickSlotHint, shouldShowMetaHint } from "@/lib/guess-top-hints";
import type {
  GuessTopPublicRound,
  GuessTopPublicSlot,
  RevealedSlot,
} from "@/lib/guess-top-types";

export type { GuessTopPublicRound, GuessTopPublicSlot, RevealedSlot };

const resolvedCache = new Map<string, GuessTopChallengeResolved>();

function challengeCacheKey(definition: GuessTopChallengeDefinition): string {
  const names = [...definition.pool].sort().join("|");
  return `${definition.id}:${names}`;
}

export async function resolveGuessTopChallenge(
  definition: GuessTopChallengeDefinition
): Promise<GuessTopChallengeResolved> {
  const cacheKey = challengeCacheKey(definition);
  const cached = resolvedCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      searchFilters: definition.searchFilters,
    };
  }

  const uniqueNames = [...new Set(definition.pool)];
  const players = await prisma.player.findMany({
    where: { name: { in: uniqueNames } },
  });

  const byName = new Map(players.map((player) => [player.name, player]));

  const pool: PoolPlayerResolved[] = uniqueNames.map((playerName) => {
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
      hint: pickSlotHint(
        player.teams,
        player.careerStart,
        player.careerEnd,
        definition.searchFilters
      ),
    };
  });

  const resolved: GuessTopChallengeResolved = {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    searchFilters: definition.searchFilters,
    pool,
  };

  resolvedCache.set(cacheKey, resolved);
  return resolved;
}

export async function resolveAllGuessTopChallenges(): Promise<
  GuessTopChallengeResolved[]
> {
  return Promise.all(GUESS_TOP_CHALLENGES.map(resolveGuessTopChallenge));
}

export async function getResolvedChallengeById(
  id: string
): Promise<GuessTopChallengeResolved | null> {
  const definition = GUESS_TOP_CHALLENGES.find((c) => c.id === id);
  if (!definition) return null;
  return resolveGuessTopChallenge(definition);
}

export function drawRoundFromChallenge(
  challenge: GuessTopChallengeResolved
): string[] {
  return drawRoundPlayers(
    challenge.pool.map((player) => player.playerId),
    GUESS_TOP_DRAW_COUNT
  );
}

export function toPublicRound(
  challenge: GuessTopChallengeResolved,
  drawnPlayerIds: string[],
  revealedPlayerIds: string[]
): GuessTopPublicRound {
  const byId = new Map(challenge.pool.map((player) => [player.playerId, player]));
  const showMetaHint = shouldShowMetaHint(challenge.searchFilters);

  return {
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    searchFilters: challenge.searchFilters,
    showMetaHint,
    slots: drawnPlayerIds.map((playerId, index) => {
      const player = byId.get(playerId);
      if (!player) {
        throw new Error(
          `Jogador sorteado não encontrado no pool ${challenge.id}: ${playerId}`
        );
      }

      const slot: GuessTopPublicSlot = {
        slotIndex: (index + 1) as 1 | 2 | 3 | 4 | 5,
        hintLabel: player.hint.label,
        nationality: player.nationality,
        position: player.position,
        showMetaHint,
      };

      if (revealedPlayerIds.includes(playerId)) {
        slot.revealed = {
          playerId: player.playerId,
          playerName: player.playerName,
          nationality: player.nationality,
          position: player.position,
          hintLabel: player.hint.label,
        };
      }

      return slot;
    }),
  };
}

export function checkPickInRound(
  challenge: GuessTopChallengeResolved,
  drawnPlayerIds: string[],
  playerId: string
): RevealedSlot | null {
  if (!drawnPlayerIds.includes(playerId)) return null;

  const player = challenge.pool.find((entry) => entry.playerId === playerId);
  if (!player) return null;

  const slotIndex = drawnPlayerIds.indexOf(playerId) + 1;

  return {
    slotIndex,
    playerId: player.playerId,
    playerName: player.playerName,
    nationality: player.nationality,
    position: player.position,
    hintLabel: player.hint.label,
  };
}
