export const PICK_TIME_LIMIT_OPTIONS: Array<{
  value: number | null;
  label: string;
}> = [
  { value: null, label: "Sem limite" },
  { value: 15, label: "15 segundos" },
  { value: 30, label: "30 segundos" },
  { value: 45, label: "45 segundos" },
  { value: 60, label: "60 segundos" },
];

export const RANKING_ROUND_TIME_LIMIT_OPTIONS: Array<{
  value: number | null;
  label: string;
}> = [
  { value: null, label: "Sem limite" },
  { value: 60, label: "1 minuto" },
  { value: 120, label: "2 minutos" },
  { value: 180, label: "3 minutos" },
  { value: 300, label: "5 minutos" },
  { value: 600, label: "10 minutos" },
];

const ALLOWED_LIMITS = new Set(
  PICK_TIME_LIMIT_OPTIONS.map((option) => option.value).filter(
    (value): value is number => value !== null
  )
);

const ALLOWED_RANKING_LIMITS = new Set(
  RANKING_ROUND_TIME_LIMIT_OPTIONS.map((option) => option.value).filter(
    (value): value is number => value !== null
  )
);

export function validatePickTimeLimit(seconds: number | null | undefined): number | null {
  if (seconds === null || seconds === undefined) {
    return null;
  }

  if (!Number.isInteger(seconds) || !ALLOWED_LIMITS.has(seconds)) {
    throw new Error("Limite de tempo inválido");
  }

  return seconds;
}

export function validateRankingRoundTimeLimit(
  seconds: number | null | undefined
): number | null {
  if (seconds === null || seconds === undefined) {
    return null;
  }

  if (!Number.isInteger(seconds) || !ALLOWED_RANKING_LIMITS.has(seconds)) {
    throw new Error("Limite de tempo inválido");
  }

  return seconds;
}

export function getTurnDeadline(
  turnStartedAt: string | null | undefined,
  limitSeconds: number | null | undefined
): string | null {
  if (!turnStartedAt || !limitSeconds) {
    return null;
  }

  const startedAt = new Date(turnStartedAt).getTime();
  if (Number.isNaN(startedAt)) {
    return null;
  }

  return new Date(startedAt + limitSeconds * 1000).toISOString();
}

export function getRankingRoundDeadline(
  openedAt: Date | string | null | undefined,
  pickTimeLimitSeconds: number | null | undefined
): string | null {
  if (!openedAt || !pickTimeLimitSeconds) {
    return null;
  }

  return getTurnDeadline(
    typeof openedAt === "string" ? openedAt : openedAt.toISOString(),
    pickTimeLimitSeconds
  );
}

export function isTurnExpired(
  turnStartedAt: string | null | undefined,
  limitSeconds: number | null | undefined,
  nowMs: number = Date.now()
): boolean {
  const deadline = getTurnDeadline(turnStartedAt, limitSeconds);
  if (!deadline) {
    return false;
  }

  return nowMs >= new Date(deadline).getTime();
}

export function formatPickTimeLimit(seconds: number | null | undefined): string {
  if (!seconds) {
    return "Sem limite";
  }

  return `${seconds}s por palpite`;
}

export function formatRankingRoundTimeLimit(
  seconds: number | null | undefined
): string {
  if (!seconds) {
    return "Sem limite";
  }

  if (seconds < 60) {
    return `${seconds}s por lista`;
  }

  const minutes = seconds / 60;
  return minutes === 1 ? "1 min por lista" : `${minutes} min por lista`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
