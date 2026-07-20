import type { ImpostorElimination, ImpostorSessionResult } from "@/lib/types";

export type ImpostorOutcome = "crew_win" | "impostor_win" | "continue";

export function resolveElimination(
  votes: { targetParticipantId: string }[],
  activeParticipantIds: string[]
): { eliminatedId: string | null; wasTie: boolean } {
  const counts = new Map<string, number>();

  for (const vote of votes) {
    if (!activeParticipantIds.includes(vote.targetParticipantId)) continue;
    counts.set(
      vote.targetParticipantId,
      (counts.get(vote.targetParticipantId) ?? 0) + 1
    );
  }

  if (counts.size === 0) {
    return { eliminatedId: null, wasTie: true };
  }

  let maxVotes = 0;
  let leaders: string[] = [];

  for (const [participantId, count] of counts) {
    if (count > maxVotes) {
      maxVotes = count;
      leaders = [participantId];
    } else if (count === maxVotes) {
      leaders.push(participantId);
    }
  }

  if (leaders.length !== 1) {
    return { eliminatedId: null, wasTie: true };
  }

  return { eliminatedId: leaders[0], wasTie: false };
}

export function checkImpostorOutcome(
  eliminatedId: string | null,
  wasTie: boolean,
  impostorParticipantId: string,
  roundNumber: number,
  totalRounds: number
): ImpostorOutcome {
  const isFinalRound = roundNumber >= totalRounds;

  if (wasTie || !eliminatedId) {
    return isFinalRound ? "impostor_win" : "continue";
  }

  if (eliminatedId === impostorParticipantId) {
    return "crew_win";
  }

  return isFinalRound ? "impostor_win" : "continue";
}

export function buildImpostorSessionResult({
  outcome,
  impostorParticipantId,
  impostorDisplayName,
  themeTitles,
  eliminations,
  participantLists,
}: {
  outcome: "crew_win" | "impostor_win";
  impostorParticipantId: string;
  impostorDisplayName: string;
  themeTitles: string[];
  eliminations: ImpostorElimination[];
  participantLists: ImpostorSessionResult["participantLists"];
}): ImpostorSessionResult {
  return {
    outcome,
    impostorParticipantId,
    impostorDisplayName,
    themeTitles,
    eliminations,
    participantLists,
  };
}
