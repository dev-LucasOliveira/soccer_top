import { randomInt } from "crypto";
import { GUESS_TOP_CHALLENGES } from "@/lib/guess-top-challenges";
import { buildHintLadder } from "@/lib/um-so-hints";
import {
  playerToHintSource,
  resolveUmSoChallenge,
} from "@/lib/um-so-score";

const MIN_HINTS = 4;
const SAMPLE_SIZE = 3;

export type UmSoHintsValidationIssue = {
  challengeId: string;
  playerName: string;
  hintCount: number;
};

export async function validateUmSoHintLadders(): Promise<{
  ok: boolean;
  issues: UmSoHintsValidationIssue[];
}> {
  const issues: UmSoHintsValidationIssue[] = [];

  for (const definition of GUESS_TOP_CHALLENGES) {
    const challenge = await resolveUmSoChallenge(definition);
    const sampleCount = Math.min(SAMPLE_SIZE, challenge.pool.length);
    const indices = new Set<number>();

    while (indices.size < sampleCount) {
      indices.add(randomInt(challenge.pool.length));
    }

    for (const index of indices) {
      const player = challenge.pool[index]!;
      const ladder = buildHintLadder(playerToHintSource(player), challenge);

      if (ladder.length < MIN_HINTS) {
        issues.push({
          challengeId: challenge.id,
          playerName: player.playerName,
          hintCount: ladder.length,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
