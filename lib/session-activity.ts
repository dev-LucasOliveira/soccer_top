export const DEFAULT_SESSION_RETENTION_MS = 86_400_000;

export type SessionActivitySnapshot = {
  createdAt: Date;
  participants: Array<{
    joinedAt: Date;
    confirmedAt: Date | null;
  }>;
  rounds: Array<{
    createdAt: Date;
    votes: Array<{ createdAt: Date }>;
    result: { createdAt: Date } | null;
    rankingMeta: Array<{ updatedAt: Date }>;
  }>;
  result: { createdAt: Date } | null;
};

function maxDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function computeSessionLastActivityAt(session: SessionActivitySnapshot): Date {
  const timestamps: Date[] = [session.createdAt];

  for (const participant of session.participants) {
    timestamps.push(participant.joinedAt);
    if (participant.confirmedAt) {
      timestamps.push(participant.confirmedAt);
    }
  }

  for (const round of session.rounds) {
    timestamps.push(round.createdAt);

    for (const vote of round.votes) {
      timestamps.push(vote.createdAt);
    }

    if (round.result) {
      timestamps.push(round.result.createdAt);
    }

    for (const meta of round.rankingMeta) {
      timestamps.push(meta.updatedAt);
    }
  }

  if (session.result) {
    timestamps.push(session.result.createdAt);
  }

  return maxDate(timestamps) ?? session.createdAt;
}

export function isSessionStale(
  lastActivityAt: Date,
  retentionMs: number = DEFAULT_SESSION_RETENTION_MS,
  now: Date = new Date()
): boolean {
  return lastActivityAt.getTime() < now.getTime() - retentionMs;
}
